import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { PageContainer } from "@/components/layout/page-container";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedConvexClient } from "@/lib/convex-server";

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const convex = await getAuthenticatedConvexClient();
  const details = await convex
    .query(api.orders.detail, {
      orderId: orderId as Id<"orders">,
    })
    .catch(() => null);

  if (!details) {
    notFound();
  }

  const { order, items } = details;

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link className="text-link mb-4 inline-flex" href="/account/orders">
            Back to orders
          </Link>
          <h1 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Order {shortOrderId(order._id)}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={order.paymentStatus === "paid" ? "default" : "secondary"}
            >
              {formatStatus(order.paymentStatus)}
            </Badge>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <PriceDisplay priceCents={order.subtotalCents} />
          <p className="text-muted-foreground mt-1 text-xs uppercase">
            {order.currency}
          </p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section>
          <h2 className="text-ink font-serif text-4xl leading-none">Items</h2>
          <div className="divide-border border-border mt-5 divide-y border-y">
            {items.map((item) => (
              <article className="py-5" key={item._id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="text-ink font-serif text-3xl leading-none">
                      {item.productName}
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Quantity {item.quantity} / {fitSummary(item)}
                    </p>
                  </div>
                  <PriceDisplay priceCents={item.lineSubtotalCents} />
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  {item.selectionsSnapshot.map((selection) => (
                    <div key={`${item._id}-${selection.stepCode}`}>
                      <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                        {selection.groupLabel}
                      </dt>
                      <dd className="text-ink mt-1">
                        {selection.optionLabel}
                        {selection.priceModifierCents > 0
                          ? ` (+${formatCurrency(selection.priceModifierCents)})`
                          : ""}
                      </dd>
                    </div>
                  ))}
                </dl>

                {item.personalizationSnapshot.monogramText ||
                item.personalizationSnapshot.notes ? (
                  <div className="bg-stone mt-5 grid gap-2 p-4 text-sm">
                    {item.personalizationSnapshot.monogramText ? (
                      <p>
                        <span className="font-semibold">Monogram:</span>{" "}
                        {item.personalizationSnapshot.monogramText}
                      </p>
                    ) : null}
                    {item.personalizationSnapshot.notes ? (
                      <p>
                        <span className="font-semibold">Notes:</span>{" "}
                        {item.personalizationSnapshot.notes}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-ink font-serif text-3xl leading-none">
            Order details
          </h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <Detail label="Created" value={formatDate(order.createdAt)} />
            <Detail
              label="Payment confirmed"
              value={
                order.paymentConfirmedAt
                  ? formatDate(order.paymentConfirmedAt)
                  : "Pending"
              }
            />
          </dl>

          <Separator className="my-6" />

          <h2 className="text-ink font-serif text-3xl leading-none">
            Shipping
          </h2>
          <address className="text-muted-foreground mt-5 text-sm leading-6 not-italic">
            <span className="text-ink font-semibold">
              {order.shippingAddress.fullName}
            </span>
            <br />
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.line2 ? (
              <>
                {order.shippingAddress.line2}
                <br />
              </>
            ) : null}
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </address>
        </aside>
      </div>
    </PageContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-1 break-words">{value}</dd>
    </div>
  );
}

function shortOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatCurrency(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}

function fitSummary(item: {
  fitMethod: "standard" | "made-to-measure";
  jacketSize?: string;
  trouserSize?: string;
  trouserWaist?: string;
  trouserInseam?: string;
  fitPreference?: "slim" | "classic" | "relaxed";
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
}) {
  if (item.fitMethod === "made-to-measure") {
    if (item.measurementAppointmentRequired) {
      return "Measurement appointment required";
    }

    return item.measurementProfileName
      ? `Measurements: ${item.measurementProfileName}`
      : "Made to Measure";
  }

  const trouser = item.trouserSize
    ? `Trouser ${item.trouserSize}`
    : `Waist ${item.trouserWaist} / Inseam ${item.trouserInseam}`;

  return `Standard Fit: Jacket ${item.jacketSize}, ${trouser}, ${item.fitPreference} fit`;
}
