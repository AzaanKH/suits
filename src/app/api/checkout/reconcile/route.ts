import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { getCheckoutSessionOrderData } from "@/lib/stripe-checkout-session";

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
