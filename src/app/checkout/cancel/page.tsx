import { auth } from "@clerk/nextjs/server";
import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { isClerkConfigured } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
};

export default async function CheckoutCancelPage() {
  if (isClerkConfigured()) {
    await auth.protect();
  }

  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <section className="border-border bg-card mx-auto max-w-xl rounded-lg border p-6 text-center sm:p-8">
        <div className="text-ink mx-auto flex size-10 items-center justify-center">
          <CircleAlert aria-hidden="true" className="size-5" />
        </div>
        <h1 className="text-ink mt-4 font-serif text-5xl leading-none">
          Checkout cancelled
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-6">
          Stripe did not complete payment. Your cart remains available until a
          verified successful payment clears it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="button-primary" href="/checkout">
            Return to checkout
          </Link>
          <Link className="button-secondary" href="/account/orders">
            Order history
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
