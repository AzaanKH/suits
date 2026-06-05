import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ZodError } from "zod";

import { api } from "../../../../convex/_generated/api";
import { checkoutPreparationSchema } from "@/features/checkout/schema";

export async function POST(request: Request) {
  const { getToken, userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeWebhookProcessingSecret =
    process.env.STRIPE_WEBHOOK_PROCESSING_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  let checkoutPreparation;

  try {
    checkoutPreparation = checkoutPreparationSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ZodError
            ? "Complete the shipping address before payment."
            : "Invalid checkout request.",
      },
      { status: 400 },
    );
  }

  if (
    !stripeSecretKey ||
    !stripeWebhookSecret ||
    !stripeWebhookProcessingSecret ||
    !appUrl ||
    !convexUrl
  ) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured." },
      { status: 503 },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  const convexToken = await getToken({ template: "convex" });

  if (!convexToken) {
    return NextResponse.json(
      { error: "Authentication is not configured for checkout." },
      { status: 401 },
    );
  }

  convex.setAuth(convexToken);

  let pendingOrder;

  try {
    pendingOrder = await convex.mutation(api.orders.createPendingFromCart, {
      shippingAddress: checkoutPreparation.shippingAddress,
      currency: "usd",
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json(
        { error: "Authentication is required for checkout." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: getCheckoutValidationMessage(error) },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: userId,
        customer_email: checkoutPreparation.shippingAddress.email,
        customer_creation: "if_required",
        phone_number_collection: {
          enabled: true,
        },
        line_items: pendingOrder.lineItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: pendingOrder.currency,
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
              description: summarizeSelections(item.selections),
              metadata: {
                orderId: pendingOrder.orderId,
                productId: item.productId,
                slug: item.productSlug,
                cartLineId: item.lineId,
                fitMethod: item.fitMethod,
                jacketSize: item.jacketSize ?? "",
                trouserSize: item.trouserSize ?? "",
                trouserWaist: item.trouserWaist ?? "",
                trouserInseam: item.trouserInseam ?? "",
                fitPreference: item.fitPreference ?? "",
                measurementProfileId: item.measurementProfileId ?? "",
                measurementAppointmentRequired:
                  item.measurementAppointmentRequired ? "true" : "false",
              },
            },
          },
        })),
        metadata: {
          orderId: pendingOrder.orderId,
          clerkUserId: userId,
          subtotalCents: String(pendingOrder.subtotalCents),
          currency: pendingOrder.currency,
        },
        payment_intent_data: {
          metadata: {
            orderId: pendingOrder.orderId,
            clerkUserId: userId,
          },
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/checkout/cancel?order_id=${pendingOrder.orderId}`,
      },
      {
        idempotencyKey: `checkout_${pendingOrder.orderId}`,
      },
    );

    if (!session.url) {
      console.error("Stripe Checkout Session did not include a URL.");

      return NextResponse.json(
        { error: "Unable to start payment." },
        { status: 502 },
      );
    }

    await convex.mutation(api.orders.attachCheckoutSession, {
      orderId: pendingOrder.orderId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Unable to create Stripe Checkout Session.", error);

    return NextResponse.json(
      { error: "Unable to start payment." },
      { status: 502 },
    );
  }
}

function summarizeSelections(
  selections: Array<{ groupLabel: string; optionLabel: string }>,
) {
  return selections
    .map((selection) => `${selection.groupLabel}: ${selection.optionLabel}`)
    .join(" / ")
    .slice(0, 500);
}

function isAuthenticationError(error: unknown) {
  return (
    error instanceof Error &&
    /authentication|unauthorized|auth/i.test(error.message)
  );
}

function getCheckoutValidationMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    const match = error.message.match(/Uncaught ConvexError: (.*)/);

    return match?.[1] ?? error.message;
  }

  return "Unable to validate cart for checkout.";
}
