"use client";

import { useAuth } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSignInRedirectHref } from "@/lib/auth-redirect";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function CheckoutButton({
  checkoutEnabled,
}: {
  checkoutEnabled: boolean;
}) {
  if (!clerkConfigured || !checkoutEnabled) {
    return (
      <Button className="mt-6 w-full" type="button" disabled>
        <CreditCard aria-hidden="true" />
        {clerkConfigured ? "Checkout unavailable" : "Checkout setup required"}
      </Button>
    );
  }

  return <ClerkCheckoutButton />;
}

function ClerkCheckoutButton() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  function handleCheckout() {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push(getSignInRedirectHref("/checkout"));
      return;
    }

    router.push("/checkout");
  }

  return (
    <Button
      className="mt-6 w-full"
      type="button"
      onClick={handleCheckout}
      disabled={!isLoaded}
    >
      <CreditCard aria-hidden="true" />
      {returnTo === "/checkout" ? "Continue checkout" : "Prepare checkout"}
    </Button>
  );
}
