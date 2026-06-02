import type { PriceModifier, Product } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatBasePrice(product: Product) {
  return `From ${formatCurrency(product.basePrice)}`;
}

export function formatPriceModifier(priceModifier?: PriceModifier) {
  if (!priceModifier || priceModifier.amount === 0) {
    return "Included";
  }

  const sign = priceModifier.amount > 0 ? "+" : "-";

  return `${sign}${formatCurrency(Math.abs(priceModifier.amount))}`;
}
