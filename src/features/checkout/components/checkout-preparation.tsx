"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, CreditCard, Ruler } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/storefront/empty-state";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  checkoutPreparationSchema,
  defaultShippingAddressValues,
  type CheckoutPreparationValues,
} from "@/features/checkout/schema";

type CheckoutPreparationProps = {
  clerkConfigured: boolean;
  checkoutEnabled: boolean;
};

type CheckoutLineItem = {
  lineId: string;
  productName: string;
  productSlug: string;
  unitPriceCents: number;
  quantity: number;
  selections: Array<{ groupLabel: string; optionLabel: string }>;
  fitMethod: "standard" | "made-to-measure";
  jacketSize?: string;
  trouserSize?: string;
  trouserWaist?: string;
  trouserInseam?: string;
  fitPreference?: "slim" | "classic" | "relaxed";
  measurementProfileId?: Id<"measurementProfiles">;
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
};

export function CheckoutPreparation({
  clerkConfigured,
  checkoutEnabled,
}: CheckoutPreparationProps) {
  const cart = useQuery(api.carts.forCheckout, clerkConfigured ? {} : "skip");
  const profiles = useQuery(
    api.measurementProfiles.mine,
    clerkConfigured ? {} : "skip",
  );
  const setMeasurementChoice = useMutation(api.carts.setLineMeasurementChoice);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [startingPayment, setStartingPayment] = useState(false);
  const form = useForm<CheckoutPreparationValues>({
    resolver: zodResolver(checkoutPreparationSchema),
    defaultValues: {
      shippingAddress: defaultShippingAddressValues,
    },
    mode: "onBlur",
  });

  if (!clerkConfigured) {
    return (
      <EmptyState
        title="Checkout setup required."
        description="Add Clerk keys to .env.local to enable authenticated checkout."
        action={{ label: "Return to cart", href: "/cart" }}
      />
    );
  }

  if (!checkoutEnabled) {
    return (
      <EmptyState
        title="Payment setup required."
        description="Add Stripe, Convex, and app URL environment variables before payment can begin."
        action={{ label: "Return to cart", href: "/cart" }}
      />
    );
  }

  if (cart === undefined || profiles === undefined) {
    return <CheckoutSkeleton />;
  }

  const lineItems = cart.lineItems as CheckoutLineItem[];
  const incompleteFitLines = lineItems.filter((item) => !isReady(item));

  async function handleMeasurementChange(lineId: string, value: string) {
    setBusyLineId(lineId);

    try {
      if (value === "appointment") {
        await setMeasurementChoice({
          lineId,
          measurementAppointmentRequired: true,
        });
      } else if (value.startsWith("profile:")) {
        await setMeasurementChoice({
          lineId,
          measurementProfileId: value.replace(
            "profile:",
            "",
          ) as Id<"measurementProfiles">,
        });
      } else {
        await setMeasurementChoice({ lineId });
      }
    } catch {
      toast.error("Unable to update measurement choice.");
    } finally {
      setBusyLineId(null);
    }
  }

  async function handleSubmit(values: CheckoutPreparationValues) {
    if (incompleteFitLines.length > 0) {
      toast.error("Complete fit details for every suit.");
      return;
    }

    setStartingPayment(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Unable to start checkout.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      toast.error("Unable to start checkout.");
    } finally {
      setStartingPayment(false);
    }
  }

  if (lineItems.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty."
        description="Add a configured suit before preparing checkout."
        action={{ label: "Explore the collection", href: "/shop" }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
      <div className="grid gap-9">
        <section>
          <h2 className="text-ink font-serif text-4xl leading-none">
            Fit details
          </h2>
          <div className="divide-border border-border mt-5 divide-y border-y">
            {lineItems.map((item) => (
              <article className="grid gap-4 py-5" key={item.lineId}>
                <div>
                  <h3 className="text-ink font-serif text-3xl leading-none">
                    {item.productName}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {item.selections
                      .slice(0, 4)
                      .map((selection) => selection.optionLabel)
                      .join(" / ")}
                  </p>
                  <p className="text-muted-foreground mt-3 inline-flex items-center gap-2 text-sm">
                    {item.fitMethod === "made-to-measure" ? (
                      <CalendarClock aria-hidden="true" className="size-4" />
                    ) : (
                      <Ruler aria-hidden="true" className="size-4" />
                    )}
                    {readinessLabel(item)}
                  </p>
                </div>
                {item.fitMethod === "made-to-measure" ? (
                  <div>
                    <label
                      className="text-sm leading-none font-medium"
                      htmlFor={`measurement-${item.lineId}`}
                    >
                      Measurement choice
                    </label>
                    <select
                      id={`measurement-${item.lineId}`}
                      className="form-control mt-2 rounded-lg py-2"
                      value={measurementValue(item)}
                      disabled={busyLineId === item.lineId}
                      onChange={(event) =>
                        handleMeasurementChange(item.lineId, event.target.value)
                      }
                    >
                      <option value="">Select measurements</option>
                      {profiles.map((profile) => (
                        <option
                          value={`profile:${profile._id}`}
                          key={profile._id}
                        >
                          {profile.name}
                        </option>
                      ))}
                      <option value="appointment">
                        Measurement appointment required
                      </option>
                    </select>
                    {profiles.length === 0 ? (
                      <Link
                        className="text-link mt-3"
                        href="/account/measurements"
                      >
                        Create a profile
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-ink font-serif text-4xl leading-none">
            Shipping address
          </h2>
          <Form {...form}>
            <form
              className="mt-5 grid gap-4"
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckoutInput
                  name="shippingAddress.fullName"
                  label="Full name"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.email"
                  label="Email"
                  type="email"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.phone"
                  label="Phone"
                  type="tel"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.line1"
                  label="Address line 1"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.line2"
                  label="Address line 2"
                  control={form.control}
                />
                <CheckoutInput
                  name="shippingAddress.city"
                  label="City"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.state"
                  label="State / region"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.postalCode"
                  label="Postal code"
                  control={form.control}
                  required
                />
                <CheckoutInput
                  name="shippingAddress.country"
                  label="Country"
                  control={form.control}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link className="text-link" href="/cart">
                  Return to cart
                </Link>
                <Button
                  type="submit"
                  disabled={
                    startingPayment ||
                    incompleteFitLines.length > 0 ||
                    form.formState.isSubmitting
                  }
                >
                  <CreditCard aria-hidden="true" />
                  {startingPayment ? "Starting payment" : "Continue to payment"}
                </Button>
              </div>
            </form>
          </Form>
        </section>
      </div>

      <aside className="bg-stone h-fit p-6 sm:p-7">
        <h2 className="text-ink font-serif text-3xl">Order summary</h2>
        <div className="divide-border mt-5 divide-y border-y">
          {lineItems.map((item) => (
            <div className="py-4 text-sm" key={item.lineId}>
              <div className="flex justify-between gap-3">
                <span className="text-ink font-semibold">
                  {item.productName} x {item.quantity}
                </span>
                <PriceDisplay
                  priceCents={item.unitPriceCents * item.quantity}
                />
              </div>
              <p className="text-muted-foreground mt-2">
                {readinessLabel(item)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between text-sm font-semibold">
          <span>Subtotal</span>
          <PriceDisplay priceCents={cart.subtotalCents} />
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Taxes and delivery are calculated in Stripe.
        </p>
        {incompleteFitLines.length > 0 ? (
          <p className="text-destructive mt-4 text-sm font-medium">
            {incompleteFitLines.length} suit
            {incompleteFitLines.length === 1 ? " needs" : "s need"} complete fit
            details.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function CheckoutInput({
  control,
  name,
  label,
  type = "text",
  required = false,
}: {
  control: ReturnType<typeof useForm<CheckoutPreparationValues>>["control"];
  name:
    | "shippingAddress.fullName"
    | "shippingAddress.email"
    | "shippingAddress.phone"
    | "shippingAddress.line1"
    | "shippingAddress.line2"
    | "shippingAddress.city"
    | "shippingAddress.state"
    | "shippingAddress.postalCode"
    | "shippingAddress.country";
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? (
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            ) : null}
          </FormLabel>
          <FormControl>
            <Input type={type} required={required} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function isReady(item: CheckoutLineItem) {
  if (item.fitMethod === "standard") {
    return Boolean(
      item.jacketSize &&
      item.fitPreference &&
      (item.trouserSize || (item.trouserWaist && item.trouserInseam)),
    );
  }

  return Boolean(
    item.measurementAppointmentRequired || item.measurementProfileId,
  );
}

function measurementValue(item: CheckoutLineItem) {
  if (item.measurementAppointmentRequired) {
    return "appointment";
  }

  if (item.measurementProfileId) {
    return `profile:${item.measurementProfileId}`;
  }

  return "";
}

function readinessLabel(item: CheckoutLineItem) {
  if (item.fitMethod === "standard") {
    if (
      !item.jacketSize ||
      !item.fitPreference ||
      (!item.trouserSize && (!item.trouserWaist || !item.trouserInseam))
    ) {
      return "Standard Fit: Pending";
    }

    const trouser = item.trouserSize
      ? `Trouser ${item.trouserSize}`
      : `Waist ${item.trouserWaist} / Inseam ${item.trouserInseam}`;

    return `Standard Fit: Jacket ${item.jacketSize}, ${trouser}, ${item.fitPreference} fit`;
  }

  if (item.measurementAppointmentRequired) {
    return "Measurement appointment required";
  }

  if (item.measurementProfileName) {
    return `Measurements: ${item.measurementProfileName}`;
  }

  return "Measurements needed";
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <div className="grid gap-5">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
