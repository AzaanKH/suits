"use client";

import { useQuery } from "convex/react";
import { CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { api } from "../../../../convex/_generated/api";
import { useCartStore } from "@/store/cart-store";

export function CheckoutSuccessStatus({ sessionId }: { sessionId?: string }) {
  const clearCart = useCartStore((state) => state.clearCart);
  const order = useQuery(
    api.orders.byCheckoutSessionForCurrentUser,
    sessionId ? { stripeCheckoutSessionId: sessionId } : "skip",
  );

  useEffect(() => {
    if (order?.paymentStatus === "paid") {
      clearCart();
    }
  }, [clearCart, order?.paymentStatus]);

  if (!sessionId) {
    return (
      <StatusBlock
        icon={<Clock aria-hidden="true" className="size-5" />}
        title="Payment status unavailable"
        description="Stripe did not return a Checkout Session id. Your order history will update after the webhook is processed."
      />
    );
  }

  if (order === undefined) {
    return (
      <StatusBlock
        icon={<Clock aria-hidden="true" className="size-5" />}
        title="Confirming payment"
        description="Stripe accepted the payment redirect. Arden is waiting for the verified webhook before clearing the cart."
      />
    );
  }

  if (!order || order.paymentStatus !== "paid") {
    return (
      <StatusBlock
        icon={<Clock aria-hidden="true" className="size-5" />}
        title="Payment processing"
        description="Your order is visible in account history once Stripe confirms payment through the webhook."
      />
    );
  }

  return (
    <StatusBlock
      icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
      title="Payment confirmed"
      description="The order is paid and your cart has been cleared."
      actionHref={`/account/orders/${order._id}`}
      actionLabel="View order"
    />
  );
}

function StatusBlock({
  icon,
  title,
  description,
  actionHref = "/account/orders",
  actionLabel = "Order history",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="border-border bg-card mx-auto max-w-xl rounded-lg border p-6 text-center sm:p-8">
      <div className="text-ink mx-auto flex size-10 items-center justify-center">
        {icon}
      </div>
      <h1 className="text-ink mt-4 font-serif text-5xl leading-none">
        {title}
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-6">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link className="button-primary" href={actionHref}>
          {actionLabel}
        </Link>
        <Link className="button-secondary" href="/shop">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
