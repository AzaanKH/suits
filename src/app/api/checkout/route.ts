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

  if (!stripeSecretKey || !appUrl || !convexUrl) {
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

  let cart;

  try {
    cart = await convex.query(api.carts.forCheckout, {
      requireMeasurements: true,
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

  if (cart.lineItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_email: checkoutPreparation.shippingAddress.email,
    customer_creation: "if_required",
    phone_number_collection: {
      enabled: true,
    },
    line_items: cart.lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unitPriceCents,
        product_data: {
          name: item.productName,
          description: summarizeSelections(item.selections),
          metadata: {
            productId: item.productId,
            slug: item.productSlug,
            cartLineId: item.lineId,
            measurementProfileId: item.measurementProfileId ?? "",
            measurementAppointmentRequired: item.measurementAppointmentRequired
              ? "true"
              : "false",
          },
        },
      },
    })),
    metadata: {
      clerkUserId: userId,
      shippingName: checkoutPreparation.shippingAddress.fullName,
      shippingLine1: checkoutPreparation.shippingAddress.line1,
      shippingLine2: checkoutPreparation.shippingAddress.line2 ?? "",
      shippingCity: checkoutPreparation.shippingAddress.city,
      shippingState: checkoutPreparation.shippingAddress.state,
      shippingPostalCode: checkoutPreparation.shippingAddress.postalCode,
      shippingCountry: checkoutPreparation.shippingAddress.country,
      shippingPhone: checkoutPreparation.shippingAddress.phone,
    },
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/checkout`,
  });

  return NextResponse.json({ url: session.url });
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
