import type { Metadata } from "next";
import Link from "next/link";

import { api } from "../../../../convex/_generated/api";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/storefront/empty-state";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedConvexClient } from "@/lib/convex-server";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function OrdersPage() {
  const convex = await getAuthenticatedConvexClient();
  const orders = await convex.query(api.orders.mine, {});

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Orders
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
            Paid Stripe Checkout orders and in-progress payment attempts for
            this Clerk account.
          </p>
        </div>
        <Link className="button-secondary" href="/account">
          Account
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet."
          description="Completed Stripe Checkout purchases will appear here after the verified webhook is processed."
          action={{ label: "Shop suits", href: "/shop" }}
        />
      ) : (
        <div className="divide-border border-border divide-y border-y">
          {orders.map((order) => (
            <Link
              className="hover:bg-muted/50 grid gap-4 py-5 transition-colors sm:grid-cols-[1fr_auto] sm:items-center"
              href={`/account/orders/${order._id}`}
              key={order._id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-ink font-serif text-3xl leading-none">
                    Order {shortOrderId(order._id)}
                  </h2>
                  <Badge variant={statusVariant(order.paymentStatus)}>
                    {formatStatus(order.paymentStatus)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {formatDate(order.createdAt)} / {order.itemCount} item
                  {order.itemCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <PriceDisplay priceCents={order.subtotalCents} />
                <p className="text-muted-foreground mt-1 text-xs uppercase">
                  {order.currency}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function shortOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusVariant(status: string) {
  return status === "paid" ? "default" : "secondary";
}
