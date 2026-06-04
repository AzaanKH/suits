"use client";

import { useAuth } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
        {clerkConfigured ? "Sign in to checkout" : "Checkout setup required"}
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
  const [loading, setLoading] = useState(false);
  const returnTo = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  async function handleCheckout() {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push(getSignInRedirectHref(returnTo));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
      setLoading(false);
    }
  }

  return (
    <Button
      className="mt-6 w-full"
      type="button"
      onClick={handleCheckout}
      disabled={!isLoaded || loading}
    >
      <CreditCard aria-hidden="true" />
      {loading ? "Starting checkout" : "Checkout"}
    </Button>
  );
}
