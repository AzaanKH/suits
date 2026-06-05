import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

const reconcileCheckoutSchema = z.object({
  sessionId: z.string().trim().startsWith("cs_"),
});

export async function POST(request: Request) {
  const { userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const processingSecret = process.env.STRIPE_WEBHOOK_PROCESSING_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!stripeSecretKey || !processingSecret || !convexUrl) {
    return NextResponse.json(
      { error: "Stripe checkout reconciliation is not configured." },
      { status: 503 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    throw error;
  }

  const parsed = reconcileCheckoutSchema.safeParse(requestBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Checkout Session." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
  } catch (error) {
    return getStripeSessionRetrieveErrorResponse(error);
  }

  if (session.client_reference_id !== userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  const result = await convex.mutation(api.orders.recordCheckoutSessionStatus, {
    processingSecret,
    stripeEventId: `reconcile_${session.id}_${session.payment_status}`,
    eventType: "checkout.session.reconciled",
    checkoutSessionId: session.id,
    paymentIntentId: getStripeId(session.payment_intent),
    paymentStatus: getCheckoutSessionPaymentStatus(session),
    orderId: getOrderId(session.metadata),
    ...getCheckoutSessionOrderData(session),
  });

  return NextResponse.json(result);
}

function getStripeId(
  value: string | Stripe.PaymentIntent | Stripe.Customer | null,
) {
  if (typeof value === "string") {
    return value;
  }

  return value?.id;
}

function getOrderId(
  metadata: Stripe.Metadata | null,
): Id<"orders"> | undefined {
  const orderId = metadata?.orderId;

  return orderId ? (orderId as Id<"orders">) : undefined;
}

function getCheckoutSessionPaymentStatus(session: Stripe.Checkout.Session) {
  if (session.status === "expired") {
    return "failed";
  }

  return session.payment_status === "paid" ? "paid" : "unpaid";
}

function getStripeSessionRetrieveErrorResponse(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    const status = error.statusCode ?? 502;

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Checkout Session not found." },
        { status: status === 404 ? 404 : 400 },
      );
    }

    if (status >= 400 && status < 500) {
      return NextResponse.json(
        { error: "Unable to retrieve Checkout Session." },
        { status },
      );
    }
  }

  return NextResponse.json(
    { error: "Stripe is unavailable for checkout reconciliation." },
    { status: 502 },
  );
}

function getCheckoutSessionOrderData(session: Stripe.Checkout.Session) {
  const shippingAddress = getCheckoutSessionShippingAddress(session);

  return {
    ...(session.amount_subtotal !== null
      ? { stripeSubtotalCents: session.amount_subtotal }
      : {}),
    ...(session.total_details?.amount_tax !== undefined
      ? { stripeTaxCents: session.total_details.amount_tax }
      : {}),
    ...(session.amount_total !== null
      ? { stripeTotalCents: session.amount_total }
      : {}),
    ...(shippingAddress ? { shippingAddress } : {}),
  };
}

function getCheckoutSessionShippingAddress(session: Stripe.Checkout.Session) {
  const shippingDetails = session.collected_information?.shipping_details;
  const address = shippingDetails?.address;
  const fullName = shippingDetails?.name ?? session.customer_details?.name;
  const email = session.customer_details?.email;
  const phone = session.customer_details?.phone;

  if (
    !address?.line1 ||
    !address.city ||
    !address.state ||
    !address.postal_code ||
    !address.country ||
    !fullName ||
    !email ||
    !phone
  ) {
    return undefined;
  }

  return {
    fullName,
    email,
    phone,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country === "US" ? "United States" : address.country,
  };
}
