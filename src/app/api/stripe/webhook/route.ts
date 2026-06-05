import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const processingSecret = process.env.STRIPE_WEBHOOK_PROCESSING_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!stripeSecretKey || !webhookSecret || !processingSecret || !convexUrl) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await convex.mutation(
          api.orders.recordCheckoutSessionStatus,
          {
            processingSecret,
            stripeEventId: event.id,
            eventType: event.type,
            checkoutSessionId: session.id,
            paymentIntentId: getStripeId(session.payment_intent),
            paymentStatus: getCheckoutSessionPaymentStatus(event.type, session),
            orderId: getOrderId(session.metadata),
            ...getCheckoutSessionOrderData(session),
          },
        );
        console.info("Processed Stripe Checkout Session webhook.", {
          eventId: event.id,
          eventType: event.type,
          checkoutSessionId: session.id,
          result,
        });
        break;
      }

      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const result = await convex.mutation(
          api.orders.recordPaymentIntentStatus,
          {
            processingSecret,
            stripeEventId: event.id,
            eventType: event.type,
            paymentIntentId: paymentIntent.id,
            paymentStatus:
              event.type === "payment_intent.succeeded" ? "paid" : "failed",
            orderId: getOrderId(paymentIntent.metadata),
          },
        );
        console.info("Processed Stripe PaymentIntent webhook.", {
          eventId: event.id,
          eventType: event.type,
          paymentIntentId: paymentIntent.id,
          result,
        });
        break;
      }

      default:
        console.info("Skipped unsupported Stripe webhook event.", {
          eventId: event.id,
          eventType: event.type,
        });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to process Stripe webhook event.", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Unable to process Stripe webhook event." },
      { status: 500 },
    );
  }
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

function getCheckoutSessionPaymentStatus(
  eventType: string,
  session: Stripe.Checkout.Session,
) {
  if (
    eventType === "checkout.session.async_payment_failed" ||
    eventType === "checkout.session.expired"
  ) {
    return "failed";
  }

  return session.payment_status === "paid" ? "paid" : "unpaid";
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
