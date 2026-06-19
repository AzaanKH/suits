"use client";

import {
  CheckoutElementsProvider,
  ContactDetailsElement,
  PaymentElement,
  ShippingAddressElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import type {
  StripeAddressElementChangeEvent,
  StripeContactDetailsElementChangeEvent,
} from "@stripe/stripe-js";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { CalendarClock, Check, CreditCard, Ruler } from "lucide-react";
import Link from "next/link";
import { Component, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/storefront/empty-state";
import { PriceDisplay } from "@/components/storefront/price-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShippingAddressValues } from "@/features/checkout/schema";
import type { AddressValidationResult } from "@/lib/usps-addresses";

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

type ValidationResponse = AddressValidationResult & {
  validationId: Id<"addressValidations">;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

export function CheckoutPreparation({
  clerkConfigured,
  checkoutEnabled,
}: CheckoutPreparationProps) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const cart = useQuery(
    api.carts.forCheckout,
    clerkConfigured && isAuthenticated ? {} : "skip",
  );
  const profiles = useQuery(
    api.measurementProfiles.mine,
    clerkConfigured && isAuthenticated ? {} : "skip",
  );
  const savedAddresses = useQuery(
    api.orders.savedAddresses,
    clerkConfigured && isAuthenticated ? {} : "skip",
  );
  const setMeasurementChoice = useMutation(api.carts.setLineMeasurementChoice);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<{
    clientSecret: string;
    orderId: Id<"orders">;
    sessionId: string;
  } | null>(null);

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
        description="Add Stripe, USPS, Convex, and app URL environment variables before payment can begin."
        action={{ label: "Return to cart", href: "/cart" }}
      />
    );
  }

  if (authLoading) {
    return <CheckoutSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in required."
        description="Sign in before preparing checkout."
        action={{ label: "Sign in", href: "/sign-in" }}
      />
    );
  }

  if (
    cart === undefined ||
    profiles === undefined ||
    savedAddresses === undefined
  ) {
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

  async function startCheckout() {
    if (incompleteFitLines.length > 0) {
      toast.error("Complete fit details for every suit.");
      return;
    }

    setStartingCheckout(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as {
        clientSecret?: string;
        orderId?: Id<"orders">;
        sessionId?: string;
        error?: string;
      };

      if (
        !response.ok ||
        !data.clientSecret ||
        !data.orderId ||
        !data.sessionId
      ) {
        toast.error(data.error ?? "Unable to start checkout.");
        return;
      }

      setCheckoutSession({
        clientSecret: data.clientSecret,
        orderId: data.orderId,
        sessionId: data.sessionId,
      });
    } catch {
      toast.error("Unable to start checkout.");
    } finally {
      setStartingCheckout(false);
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
                      disabled={
                        busyLineId === item.lineId || Boolean(checkoutSession)
                      }
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
            Shipping and payment
          </h2>
          {checkoutSession ? (
            <div className="mt-5">
              <CheckoutProviderBoundary
                key={checkoutSession.sessionId}
                onReset={() => setCheckoutSession(null)}
              >
                <CheckoutElementsProvider
                  stripe={stripePromise}
                  options={{
                    clientSecret: checkoutSession.clientSecret,
                    elementsOptions: {
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#17201b",
                          colorText: "#17201b",
                          borderRadius: "8px",
                          fontFamily: "Manrope, sans-serif",
                        },
                      },
                    },
                  }}
                >
                  <StripeCheckoutForm
                    orderId={checkoutSession.orderId}
                    savedAddresses={savedAddresses}
                  />
                </CheckoutElementsProvider>
              </CheckoutProviderBoundary>
            </div>
          ) : (
            <div className="border-border mt-5 border-y py-6">
              <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                Stripe securely collects contact, shipping, and payment details.
                USPS checks deliverability before payment.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link className="text-link" href="/cart">
                  Return to cart
                </Link>
                <Button
                  type="button"
                  disabled={startingCheckout || incompleteFitLines.length > 0}
                  onClick={startCheckout}
                >
                  <CreditCard aria-hidden="true" />
                  {startingCheckout
                    ? "Starting secure checkout"
                    : "Enter shipping details"}
                </Button>
              </div>
            </div>
          )}
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
          Stripe Tax calculates sales tax after the shipping address is
          validated. Delivery is arranged by our tailoring team after payment.
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

class CheckoutProviderBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Unable to load Stripe checkout elements.", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="border-border bg-stone border p-5 sm:p-6">
          <h3 className="text-ink font-serif text-3xl">
            Payment form could not load.
          </h3>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Check that the Stripe publishable key and secret key are from the
            same Stripe account and mode, then start checkout again.
          </p>
          <p className="text-destructive mt-3 text-sm">
            {this.state.error.message}
          </p>
          <Button className="mt-5" type="button" onClick={this.props.onReset}>
            Start checkout again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

function StripeCheckoutForm({
  orderId,
  savedAddresses,
}: {
  orderId: Id<"orders">;
  savedAddresses: ShippingAddressValues[];
}) {
  const checkoutState = useCheckoutElements();
  const applyingSelection = useRef(false);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  const [address, setAddress] = useState<ShippingAddressValues | null>(null);
  const [addressComplete, setAddressComplete] = useState(false);
  const [email, setEmail] = useState("");
  const [emailComplete, setEmailComplete] = useState(false);
  const [phone, setPhone] = useState("");
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [selected, setSelected] = useState(false);
  const [addressElementHidden, setAddressElementHidden] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [paying, setPaying] = useState(false);
  const addressContacts = useMemo(
    () =>
      savedAddresses.map((savedAddress) => ({
        name: savedAddress.fullName,
        address: {
          line1: savedAddress.line1,
          ...(savedAddress.line2 ? { line2: savedAddress.line2 } : {}),
          city: savedAddress.city,
          state: savedAddress.state,
          postal_code: savedAddress.postalCode,
          country: "US",
        },
      })),
    [savedAddresses],
  );

  if (checkoutState.type === "loading") {
    return <Skeleton className="h-96 rounded-lg" />;
  }

  if (checkoutState.type === "error") {
    return (
      <p className="text-destructive text-sm">{checkoutState.error.message}</p>
    );
  }

  const { checkout } = checkoutState;

  function handleAddressChange(event: StripeAddressElementChangeEvent) {
    setAddressComplete(event.complete);
    setAddress(
      event.complete
        ? {
            fullName: event.value.name,
            email,
            phone,
            line1: event.value.address.line1,
            line2: event.value.address.line2 ?? "",
            city: event.value.address.city,
            state: event.value.address.state,
            postalCode: event.value.address.postal_code,
            country:
              event.value.address.country === "US"
                ? "United States"
                : event.value.address.country,
          }
        : null,
    );

    if (!applyingSelection.current) {
      setValidation(null);
      setSelected(false);
    }
  }

  function handleContactChange(event: StripeContactDetailsElementChangeEvent) {
    setEmail(event.value.email);
    setEmailComplete(event.complete);
    setAddress((current) =>
      current ? { ...current, email: event.value.email } : current,
    );
    setValidation(null);
    setSelected(false);
    setAddressElementHidden(false);
  }

  function handlePhoneChange(value: string) {
    const formattedPhone = formatUsPhoneNumber(value);
    setPhone(formattedPhone);
    setAddress((current) =>
      current ? { ...current, phone: formattedPhone } : current,
    );
    setValidation(null);
    setSelected(false);
    setAddressElementHidden(false);
  }

  async function validateAddress() {
    if (
      !addressComplete ||
      !emailComplete ||
      getPhoneDigits(phone).length < 10 ||
      !address
    ) {
      toast.error("Complete contact and shipping details first.");
      return;
    }

    const shippingAddress = {
      ...address,
      email,
      phone,
    };
    setValidating(true);

    try {
      const response = await fetch("/api/address/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, shippingAddress }),
      });
      const data = (await response.json()) as ValidationResponse & {
        error?: string;
      };

      if (!response.ok || !data.validationId) {
        toast.error(data.error ?? "USPS could not validate this address.");
        return;
      }

      setAddress(shippingAddress);
      setValidation(data);
      setSelected(false);

      if (data.behavior === "accept" && !data.addressChanged) {
        await selectAddress("entered", data, shippingAddress);
      }
    } catch {
      toast.error("USPS address validation is unavailable.");
    } finally {
      setValidating(false);
    }
  }

  async function selectAddress(
    selection: "entered" | "usps",
    currentValidation = validation,
    enteredAddress = address,
  ) {
    if (!currentValidation || !enteredAddress) {
      return;
    }

    setSelecting(true);

    try {
      const response = await fetch("/api/address/select", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          validationId: currentValidation.validationId,
          selection,
        }),
      });
      const data = (await response.json()) as {
        shippingAddress?: ShippingAddressValues;
        error?: string;
      };

      if (!response.ok || !data.shippingAddress) {
        toast.error(data.error ?? "Unable to save the selected address.");
        return;
      }

      applyingSelection.current = true;
      flushSync(() => {
        setAddressElementHidden(true);
      });
      const updateResult = await checkout.updateShippingAddress({
        name: data.shippingAddress.fullName,
        address: {
          line1: data.shippingAddress.line1,
          line2: data.shippingAddress.line2 || null,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          postal_code: data.shippingAddress.postalCode,
          country: "US",
        },
      });
      applyingSelection.current = false;

      if (updateResult.type === "error") {
        setAddressElementHidden(false);
        toast.error(updateResult.error.message);
        return;
      }

      const phoneResult = await checkout.updatePhoneNumber(
        data.shippingAddress.phone,
      );

      if (phoneResult.type === "error") {
        setAddressElementHidden(false);
        toast.error("Unable to save the phone number with Stripe.");
        return;
      }

      setAddress(data.shippingAddress);
      setSelected(true);
      toast.success("Shipping address saved.");
      window.setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }, 50);
    } catch {
      applyingSelection.current = false;
      setAddressElementHidden(false);
      toast.error("Unable to save the selected address.");
    } finally {
      setSelecting(false);
    }
  }

  function changeSelectedAddress() {
    setSelected(false);
    setValidation(null);
    setAddressElementHidden(false);
  }

  async function confirmPayment(event: React.FormEvent) {
    event.preventDefault();

    if (!selected) {
      toast.error("Validate and choose a shipping address first.");
      return;
    }

    setPaying(true);

    try {
      const result = await checkout.confirm();

      if (result.type === "error") {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("Unable to process payment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <form className="grid gap-7" onSubmit={confirmPayment}>
      <div>
        <h3 className="text-ink font-serif text-3xl">Contact details</h3>
        <div className="mt-4">
          <ContactDetailsElement onChange={handleContactChange} />
        </div>
        <div className="mt-4">
          <label className="text-sm leading-none font-medium" htmlFor="phone">
            Phone
          </label>
          <Input
            id="phone"
            className="bg-background mt-2 h-12 rounded-lg border-[#e4e0d8] px-4 text-base shadow-sm md:text-base"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(425) 233-5486"
            value={phone}
            required
            onChange={(event) => handlePhoneChange(event.target.value)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-ink font-serif text-3xl">Shipping address</h3>
        {selected && address ? (
          <SelectedAddressCard
            address={address}
            onChange={changeSelectedAddress}
          />
        ) : addressElementHidden ? (
          <Skeleton className="mt-4 h-32 rounded-lg" />
        ) : (
          <>
            <div className="mt-4">
              <ShippingAddressElement
                options={{
                  contacts: addressContacts,
                  display: { name: "full" },
                }}
                onChange={handleAddressChange}
              />
            </div>
            <Button
              className="mt-4"
              type="button"
              variant="outline"
              disabled={
                validating ||
                selecting ||
                !addressComplete ||
                !emailComplete ||
                getPhoneDigits(phone).length < 10
              }
              onClick={validateAddress}
            >
              <Check aria-hidden="true" />
              {validating || selecting
                ? "Checking address"
                : "Continue to payment"}
            </Button>
          </>
        )}
      </div>

      {validation && address ? (
        <AddressReview
          enteredAddress={address}
          validation={validation}
          busy={selecting}
          selected={selected}
          onSelect={selectAddress}
        />
      ) : null}

      {selected ? (
        <div ref={paymentSectionRef} className="scroll-mt-24">
          <h3 className="text-ink font-serif text-3xl">Payment</h3>
          <div className="mt-4">
            <PaymentElement options={{ layout: "accordion" }} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-link" href="/cart">
          Return to cart
        </Link>
        <Button type="submit" disabled={!selected || paying}>
          <CreditCard aria-hidden="true" />
          {paying ? "Processing payment" : "Pay securely"}
        </Button>
      </div>
    </form>
  );
}

function AddressReview({
  enteredAddress,
  validation,
  busy,
  selected,
  onSelect,
}: {
  enteredAddress: ShippingAddressValues;
  validation: ValidationResponse;
  busy: boolean;
  selected: boolean;
  onSelect: (selection: "entered" | "usps") => void;
}) {
  const message = {
    accept: validation.addressChanged
      ? "USPS found a standardized version of this address."
      : "USPS confirmed this delivery address.",
    add_unit:
      "USPS found the building, but an apartment or unit number is required. Edit the address above and validate it again.",
    verify_unit:
      "USPS found the address, but could not confirm the apartment or unit. Verify it before continuing.",
    confirm:
      "USPS could not confirm delivery. Correct the address or explicitly keep what you entered.",
  }[validation.behavior];

  return (
    <section className="border-border bg-stone border p-5 sm:p-6">
      <h3 className="text-ink font-serif text-3xl">Review address</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{message}</p>

      {validation.addressChanged && validation.standardizedAddress ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <AddressCard label="You entered" address={enteredAddress} />
          <AddressCard
            label="USPS recommends"
            address={validation.standardizedAddress}
          />
        </div>
      ) : (
        <div className="mt-5">
          <AddressCard label="Delivery address" address={enteredAddress} />
        </div>
      )}

      {validation.corrections.length > 0 || validation.warnings.length > 0 ? (
        <ul className="text-muted-foreground mt-4 grid gap-1 text-sm">
          {[...validation.corrections, ...validation.warnings].map(
            (item, index) => (
              <li key={`${item.code}-${index}`}>{item.text || item.code}</li>
            ),
          )}
        </ul>
      ) : null}

      {validation.behavior !== "add_unit" && !selected ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {validation.standardizedAddress && validation.addressChanged ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => onSelect("usps")}
            >
              Use USPS address
            </Button>
          ) : null}
          <Button
            type="button"
            variant={
              validation.standardizedAddress && validation.addressChanged
                ? "outline"
                : "default"
            }
            disabled={busy}
            onClick={() => onSelect("entered")}
          >
            {validation.behavior === "confirm"
              ? "Keep entered address"
              : validation.behavior === "verify_unit"
                ? "Confirm entered unit"
                : "Use this address"}
          </Button>
        </div>
      ) : null}

      {selected ? (
        <p className="text-ink mt-5 inline-flex items-center gap-2 text-sm font-semibold">
          <Check aria-hidden="true" className="size-4" />
          Address confirmed
        </p>
      ) : null}
    </section>
  );
}

function SelectedAddressCard({
  address,
  onChange,
}: {
  address: ShippingAddressValues;
  onChange: () => void;
}) {
  return (
    <div className="border-border bg-background mt-4 flex items-start justify-between gap-4 rounded-lg border p-4 shadow-sm">
      <address className="text-muted-foreground text-sm leading-6 not-italic">
        <span className="text-ink block font-semibold">{address.fullName}</span>
        <span className="block">{address.line1}</span>
        {address.line2 ? <span className="block">{address.line2}</span> : null}
        <span className="block">
          {address.city}, {address.state} {address.postalCode} US
        </span>
      </address>
      <Button type="button" variant="ghost" onClick={onChange}>
        Change
      </Button>
    </div>
  );
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatUsPhoneNumber(value: string) {
  const digits = getPhoneDigits(value).slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function AddressCard({
  label,
  address,
}: {
  label: string;
  address: ShippingAddressValues;
}) {
  return (
    <div className="border-border bg-background border p-4">
      <p className="text-xs font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <address className="text-muted-foreground mt-3 text-sm leading-6 not-italic">
        <span className="text-ink block font-semibold">{address.fullName}</span>
        <span className="block">{address.line1}</span>
        {address.line2 ? <span className="block">{address.line2}</span> : null}
        <span className="block">
          {address.city}, {address.state} {address.postalCode}
        </span>
      </address>
    </div>
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
