"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { CartItemSummary } from "@/components/cart/cart-item-summary";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { PriceDisplay } from "@/components/storefront/price-display";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartController } from "./use-cart-controller";

type CartSheetProps = {
  checkoutEnabled: boolean;
};

export function CartSheet({ checkoutEnabled }: CartSheetProps) {
  const {
    items,
    itemCount,
    source,
    subtotalCents,
    loading,
    updateQuantity,
    removeItem,
  } = useCartController();

  return (
    <Sheet>
      <SheetTrigger
        data-testid="cart-link"
        className="text-ink inline-flex min-h-10 items-center gap-2 px-2 text-sm font-bold tracking-[0.08em] uppercase"
        aria-label={`Cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      >
        <ShoppingBag aria-hidden="true" className="size-[1.1rem]" />
        <span className="hidden sm:inline">Cart</span>
        <span aria-hidden="true">({itemCount})</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <SheetHeader className="border-border border-b p-5">
          <SheetTitle className="text-ink font-serif text-3xl leading-none">
            Cart
          </SheetTitle>
          <SheetDescription>
            Complete configured suits ready for checkout.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center p-5">
            <p className="text-muted-foreground text-sm">Loading cart.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center p-5">
            <h2 className="text-ink font-serif text-4xl leading-none">
              Your cart is empty.
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              Start with a suit and customize the details before adding it here.
            </p>
            <Link
              className={buttonVariants({ className: "mt-6" })}
              href="/shop"
            >
              Explore suits
            </Link>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            <div className="divide-border divide-y">
              {items.map((item) => (
                <CartItemSummary
                  key={item.lineId}
                  item={item}
                  source={source}
                  compact
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && items.length > 0 ? (
          <SheetFooter className="border-border border-t p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Subtotal</span>
              <PriceDisplay priceCents={subtotalCents} />
            </div>
            <p className="text-muted-foreground text-sm leading-6">
              Estimated total excludes taxes and delivery.
            </p>
            <CheckoutButton checkoutEnabled={checkoutEnabled} />
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/cart"
            >
              View cart
            </Link>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
