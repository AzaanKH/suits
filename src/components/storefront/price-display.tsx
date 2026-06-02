import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/product-format";

type PriceDisplayProps = {
  priceCents: number;
  className?: string;
  prefix?: string;
};

export function PriceDisplay({
  priceCents,
  className,
  prefix,
}: PriceDisplayProps) {
  return (
    <p
      className={cn("text-ink text-sm font-semibold tracking-wide", className)}
    >
      {prefix}
      {formatCurrency(priceCents)}
    </p>
  );
}
