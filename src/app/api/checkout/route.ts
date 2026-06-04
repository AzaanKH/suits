import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

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

export async function POST(request: Request) {
  const { userId } = await auth.protect();
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey || !appUrl) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured." },
      { status: 503 },
    );
  }

  const payload = checkoutRequestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_creation: "if_required",
    line_items: payload.data.items.map((item) => ({
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
