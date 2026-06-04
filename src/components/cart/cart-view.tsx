"use client";

import Link from "next/link";

import { CartItemSummary } from "@/components/cart/cart-item-summary";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { EmptyState } from "@/components/storefront/empty-state";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartController } from "./use-cart-controller";

export function CartView({ checkoutEnabled }: { checkoutEnabled: boolean }) {
  const {
    items,
    source,
    subtotalCents,
    loading,
    updateQuantity,
    removeItem,
  } = useCartController();

  if (loading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty."
        description="A considered wardrobe starts with one complete configuration. Explore the collection to begin."
        headingTag="h1"
        action={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <h1 className="text-ink font-serif text-5xl leading-none tracking-[-0.03em] sm:text-6xl">
          Shopping cart
        </h1>
        <div className="divide-border border-border mt-8 divide-y border-y">
          {items.map((item) => (
            <CartItemSummary
              key={item.lineId}
              item={item}
              source={source}
              onQuantityChange={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>
      </div>
      <aside className="bg-stone h-fit p-6 sm:p-7">
        <h2 className="text-ink font-serif text-3xl">Order summary</h2>
        <div className="border-border mt-7 flex justify-between border-t pt-5 text-sm">
          <span>Subtotal</span>
          <PriceDisplay priceCents={subtotalCents} />
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Estimated total excludes taxes and delivery, which are calculated
          during Stripe Checkout. Each order is confirmed by our tailoring team
          before production.
        </p>
        <CheckoutButton checkoutEnabled={checkoutEnabled} />
        <div className="mt-5 flex justify-center">
          <Link className="text-link" href="/shop">
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <Skeleton className="h-16 w-72 rounded-none" />
        <div className="mt-8 space-y-5">
          <Skeleton className="h-48 rounded-none" />
          <Skeleton className="h-48 rounded-none" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-none" />
    </div>
  );
}
