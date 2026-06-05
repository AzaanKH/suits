import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { CheckoutPreparation } from "@/features/checkout/components/checkout-preparation";
import { isClerkConfigured } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Prepare Checkout",
};

export default async function CheckoutPage() {
  const clerkConfigured = isClerkConfigured();

  if (clerkConfigured) {
    await auth.protect();
  }

  const checkoutEnabled = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_APP_URL &&
      process.env.NEXT_PUBLIC_CONVEX_URL,
  );

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="mb-9">
        <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
          Prepare checkout
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
          Confirm fit details and shipping before moving to Stripe Checkout.
          Arden never collects raw card numbers in this application.
        </p>
      </div>
      <CheckoutPreparation
        clerkConfigured={clerkConfigured}
        checkoutEnabled={checkoutEnabled}
      />
    </PageContainer>
  );
}
