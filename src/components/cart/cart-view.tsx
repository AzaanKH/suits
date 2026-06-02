"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { EmptyState } from "@/components/storefront/empty-state";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <EmptyState
        eyebrow="Your selection"
        title="Your cart is empty."
        description="A considered wardrobe starts with one exceptional piece. Explore the collection to begin."
        action={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <p className="eyebrow">Your selection</p>
        <h1 className="text-ink mt-5 font-serif text-6xl leading-[0.95] tracking-[-0.04em]">
          Shopping cart
        </h1>
        <div className="divide-border border-border mt-9 divide-y border-y">
          {items.map((item) => (
            <article className="flex gap-5 py-5 sm:gap-7" key={item.id}>
              <div className="bg-stone relative aspect-[2/3] w-24 shrink-0 overflow-hidden sm:w-32">
                <Image
                  fill
                  sizes="128px"
                  src={item.image}
                  alt={item.imageAlt}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 justify-between gap-3">
                <div>
                  <h2 className="text-ink font-serif text-3xl leading-none">
                    {item.name}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {item.color} / Quantity {item.quantity}
                  </p>
                  <PriceDisplay
                    price={item.price * item.quantity}
                    className="mt-5"
                  />
                </div>
                <Button
                  type="button"
                  aria-label={`Remove ${item.name} from cart`}
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="bg-stone h-fit p-6 sm:p-7">
        <h2 className="text-ink font-serif text-3xl">Order summary</h2>
        <div className="border-border mt-7 flex justify-between border-t pt-5 text-sm">
          <span>Subtotal</span>
          <PriceDisplay price={subtotal} />
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Taxes and delivery are calculated at checkout. Each order is confirmed
          by our tailoring team before production.
        </p>
        <Button
          className="button-primary mt-6 w-full rounded-none"
          type="button"
          aria-label="Checkout coming soon"
          disabled
        >
          Checkout coming soon
        </Button>
        <div className="mt-5 flex justify-center">
          <Link className="text-link" href="/shop">
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
