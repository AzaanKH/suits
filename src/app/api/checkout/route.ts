import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { api } from "../../../../convex/_generated/api";

const checkoutItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1).max(10),
  basePriceCents: z.number().int().positive(),
});

const checkoutRequestSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(20),
});

type CanonicalCheckoutItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  basePriceCents: number;
};

export async function POST(request: Request) {
  const { userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!stripeSecretKey || !appUrl || !convexUrl) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON." }, { status: 400 });
  }

  const payload = checkoutRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  const canonicalItems: Array<CanonicalCheckoutItem | null> = await Promise.all(
    payload.data.items.map(async (item) => {
      const product = await convex.query(api.products.bySlug, {
        slug: item.slug,
      });

      if (!product || product.id !== item.id || product.slug !== item.slug) {
        return null;
      }

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        basePriceCents: product.basePriceCents,
      };
    }),
  );

  if (!canonicalItems.every(isCanonicalCheckoutItem)) {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 400 },
    );
  }

  const lineItems = canonicalItems.filter(isCanonicalCheckoutItem);
  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_creation: "if_required",
    line_items: lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.basePriceCents,
        product_data: {
          name: item.name,
          metadata: {
            productId: item.id,
            slug: item.slug,
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

function isCanonicalCheckoutItem(
  item: CanonicalCheckoutItem | null,
): item is CanonicalCheckoutItem {
  return item !== null;
}
