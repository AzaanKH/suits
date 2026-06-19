import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { api } from "../../../../convex/_generated/api";

const STRIPE_SUIT_TAX_CODE = "txcd_30011000";

export async function POST(request: Request) {
  const { getToken, userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeWebhookProcessingSecret =
    process.env.STRIPE_WEBHOOK_PROCESSING_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const automaticTaxEnabled =
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true";
  await request.json().catch(() => ({}));

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
    let staleCheckoutSessionId: string | undefined;

    if (pendingOrder.stripeCheckoutSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          pendingOrder.stripeCheckoutSessionId,
        );

        if (
          existingSession.client_secret &&
          existingSession.status === "open" &&
          existingSession.ui_mode === "elements"
        ) {
          return NextResponse.json({
            clientSecret: existingSession.client_secret,
            orderId: pendingOrder.orderId,
            sessionId: existingSession.id,
          });
        }

        staleCheckoutSessionId = existingSession.id;

        if (existingSession.status === "open") {
          await stripe.checkout.sessions
            .expire(existingSession.id)
            .catch((error) => {
              console.warn(
                "Unable to expire stale Stripe Checkout Session.",
                error,
              );
            });
        }
      } catch (error) {
        staleCheckoutSessionId = pendingOrder.stripeCheckoutSessionId;
        console.warn("Unable to retrieve stored Stripe Checkout Session.", {
          stripeCheckoutSessionId: pendingOrder.stripeCheckoutSessionId,
          error,
        });
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        ui_mode: "elements",
        client_reference_id: userId,
        customer_creation: "always",
        ...(automaticTaxEnabled
          ? {
              automatic_tax: {
                enabled: true,
              },
            }
          : {}),
        shipping_address_collection: {
          allowed_countries: ["US"],
        },
        phone_number_collection: {
          enabled: true,
        },
        line_items: [
          ...pendingOrder.lineItems.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: pendingOrder.currency,
              unit_amount: item.unitPriceCents,
              tax_behavior: "exclusive" as const,
              product_data: {
                name: item.productName,
                tax_code: STRIPE_SUIT_TAX_CODE,
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
        ],
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
            subtotalCents: String(pendingOrder.subtotalCents),
          },
        },
        return_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      },
      {
        idempotencyKey: getStripeCheckoutIdempotencyKey(
          pendingOrder.checkoutAttemptKey,
          automaticTaxEnabled,
          staleCheckoutSessionId,
        ),
      },
    );

    if (!session.client_secret) {
      console.error("Stripe Checkout Session did not include a client secret.");

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
      replaceExisting: Boolean(staleCheckoutSessionId),
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      orderId: pendingOrder.orderId,
      sessionId: session.id,
    });
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

function getStripeCheckoutIdempotencyKey(
  checkoutAttemptKey: string,
  automaticTaxEnabled: boolean,
  staleCheckoutSessionId?: string,
) {
  const baseKey = `${checkoutAttemptKey}_elements_tax_${automaticTaxEnabled ? "on" : "off"}`;

  return staleCheckoutSessionId
    ? `${baseKey}_replace_${staleCheckoutSessionId}`
    : baseKey;
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
