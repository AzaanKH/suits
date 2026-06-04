import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { api } from "../../../../convex/_generated/api";

export async function POST() {
  const { getToken, userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

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
    cart = await convex.query(api.carts.forCheckout, {});
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json(
        { error: "Authentication is required for checkout." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Unable to validate cart for checkout." },
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
    customer_creation: "if_required",
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
          },
        },
      },
    })),
    metadata: {
      clerkUserId: userId,
    },
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/cart`,
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
