import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { CheckoutSuccessStatus } from "@/features/checkout/components/checkout-success-status";
import { isClerkConfigured } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Checkout Success",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (isClerkConfigured()) {
    await auth.protect();
  }

  const { session_id: sessionId } = await searchParams;

  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <CheckoutSuccessStatus sessionId={sessionId} />
    </PageContainer>
  );
}
