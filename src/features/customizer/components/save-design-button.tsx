"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { BookmarkCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { getSignInRedirectHref } from "@/lib/auth-redirect";
import { useCustomizerStore } from "@/store/customizer-store";
import type {
  ConfigurationSummary,
  CustomizerConfiguration,
} from "../types";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type SaveDesignButtonProps = {
  configuration: CustomizerConfiguration;
  summary: ConfigurationSummary;
};

export function SaveDesignButton(props: SaveDesignButtonProps) {
  if (!clerkConfigured) {
    return (
      <Button variant="outline" size="lg" disabled>
        <BookmarkCheck aria-hidden="true" />
        Sign in to save
      </Button>
    );
  }

  return <ClerkSaveDesignButton {...props} />;
}

function ClerkSaveDesignButton({
  configuration,
  summary,
}: SaveDesignButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const saveDesign = useMutation(api.savedDesigns.save);
  const markClean = useCustomizerStore((state) => state.markClean);

  const returnTo = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const authReady = isLoaded && !isLoading;

  async function handleSave() {
    if (!authReady) {
      return;
    }

    if (!isSignedIn) {
      router.push(getSignInRedirectHref(returnTo));
      return;
    }

    if (!isAuthenticated) {
      toast.error("Authentication is still syncing. Try again in a moment.");
      return;
    }

    setSaving(true);

    try {
      const submittedConfiguration = configuration;
      await saveDesign({
        productSlug: summary.productSlug,
        productName: summary.productName,
        totalPriceCents: summary.totalPriceCents,
        selectionSignature: summary.selectionSignature,
        configuration,
        selections: summary.selections,
        personalization: summary.personalization,
      });
      if (useCustomizerStore.getState().configuration === submittedConfiguration) {
        markClean();
      }
      toast.success("Design saved to your account.");
    } catch {
      toast.error("Unable to save this design.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleSave}
      disabled={!authReady || saving}
    >
      <BookmarkCheck aria-hidden="true" />
      {saving ? "Saving" : "Save design"}
    </Button>
  );
}
