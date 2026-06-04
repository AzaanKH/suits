"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/storefront/price-display";
import type { CartLineItem } from "@/store/cart-store";
import { formatPriceModifier } from "@/lib/product-format";

const fallbackCartImage = {
  src: "/images/hero-tailoring.png",
  alt: "Tailored suit placeholder",
};

type CartItemSummaryProps = {
  item: CartLineItem;
  source: "guest" | "authenticated";
  compact?: boolean;
  onQuantityChange: (lineId: string, quantity: number) => void | Promise<void>;
  onRemove: (lineId: string) => void | Promise<void>;
};

export function CartItemSummary({
  item,
  source,
  compact = false,
  onQuantityChange,
  onRemove,
}: CartItemSummaryProps) {
  const image = item.previewImageReference ?? fallbackCartImage;
  const editHref = `/customize/${item.productSlug}?cartLineId=${encodeURIComponent(
    item.lineId,
  )}&cartSource=${source}`;

  return (
    <article
      className={
        compact
          ? "grid grid-cols-[5rem_1fr] gap-4 py-4"
          : "grid gap-5 py-6 sm:grid-cols-[8rem_1fr] sm:gap-7"
      }
    >
      <div className="bg-stone relative aspect-[2/3] overflow-hidden">
        <Image
          fill
          sizes={compact ? "80px" : "128px"}
          src={image.src}
          alt={image.alt}
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className={
                compact
                  ? "text-ink font-serif text-2xl leading-none"
                  : "text-ink font-serif text-3xl leading-none"
              }
            >
              {item.productName}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {item.selections
                .slice(0, compact ? 2 : 4)
                .map((selection) => selection.optionLabel)
                .join(" / ")}
            </p>
          </div>
          <PriceDisplay
            priceCents={item.unitPriceCents * item.quantity}
            className="shrink-0 text-right"
          />
        </div>

        {!compact ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {item.selections.slice(0, 6).map((selection) => (
              <div key={`${selection.stepCode}-${selection.optionCode}`}>
                <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                  {selection.groupLabel}
                </dt>
                <dd className="text-ink mt-1 text-sm">
                  {selection.optionLabel}{" "}
                  <span className="text-muted-foreground">
                    {formatPriceModifier(selection.priceModifierCents)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {item.personalization.monogramText || item.personalization.notes ? (
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            {item.personalization.monogramText
              ? `Monogram ${item.personalization.monogramText}. `
              : ""}
            {item.personalization.notes}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="border-border inline-flex h-9 items-center border">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Decrease quantity for ${item.productName}`}
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange(item.lineId, item.quantity - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="text-ink min-w-9 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Increase quantity for ${item.productName}`}
              onClick={() => onQuantityChange(item.lineId, item.quantity + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button render={<Link href={editHref} />} variant="ghost">
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemove(item.lineId)}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
