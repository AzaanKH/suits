import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  price: number;
  className?: string;
};

export function PriceDisplay({ price, className }: PriceDisplayProps) {
  return (
    <p
      className={cn("text-ink text-sm font-semibold tracking-wide", className)}
    >
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price)}
    </p>
  );
}
