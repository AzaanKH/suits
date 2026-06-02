import type { ProductSummary } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount / 100);
}

export function formatBasePrice(product: ProductSummary) {
  return `From ${formatCurrency(product.basePriceCents)}`;
}

export function formatPriceModifier(priceModifierCents: number) {
  if (priceModifierCents === 0) {
    return "Included";
  }

  const sign = priceModifierCents > 0 ? "+" : "-";

  return `${sign}${formatCurrency(Math.abs(priceModifierCents))}`;
}
