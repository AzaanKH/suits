import { cn } from "@/lib/utils";

export type OrderPaymentStatusValue =
  | "checkout_pending"
  | "failed"
  | "paid"
  | "refunded"
  | "unpaid";

type OrderPaymentStatusProps = {
  status: OrderPaymentStatusValue;
  className?: string;
};

const statusStyles: Record<
  OrderPaymentStatusValue,
  {
    label: string;
    tag: string;
    dot: string;
  }
> = {
  paid: {
    label: "Paid",
    tag: "border-ink/25 bg-background text-ink",
    dot: "bg-accent-strong",
  },
  checkout_pending: {
    label: "Checkout pending",
    tag: "border-accent-strong/35 bg-accent/10 text-ink",
    dot: "bg-accent-strong",
  },
  unpaid: {
    label: "Unpaid",
    tag: "border-border bg-stone text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  failed: {
    label: "Failed",
    tag: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  refunded: {
    label: "Refunded",
    tag: "border-border bg-stone text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function OrderPaymentStatus({
  status,
  className,
}: OrderPaymentStatusProps) {
  const styles = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 border px-2 text-[0.68rem] leading-none font-bold tracking-[0.09em] whitespace-nowrap uppercase",
        styles.tag,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", styles.dot)} />
      {styles.label}
    </span>
  );
}
