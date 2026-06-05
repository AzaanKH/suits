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

  const parsed = reconcileCheckoutSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Checkout Session." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.retrieve(
    parsed.data.sessionId,
  );

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
