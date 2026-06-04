"use client";

import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConvexAuth, useMutation } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BookmarkCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSignInRedirectHref } from "@/lib/auth-redirect";
import { useCustomizerStore } from "@/store/customizer-store";
import type {
  ConfigurationSummary,
  CustomizerConfiguration,
} from "../types";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const designNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name this design.")
    .max(80, "Use 80 characters or fewer."),
});

type DesignNameFormValues = z.input<typeof designNameSchema>;

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
  const [open, setOpen] = useState(false);
  const saveDesign = useMutation(api.savedDesigns.save);
  const markClean = useCustomizerStore((state) => state.markClean);
  const form = useForm<DesignNameFormValues>({
    resolver: zodResolver(designNameSchema),
    defaultValues: {
      name: `${summary.productName} design`,
    },
  });

  const returnTo = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const authReady = isLoaded && !isLoading;

  function handleOpenSave() {
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

    form.reset({ name: `${summary.productName} design` });
    setOpen(true);
  }

  async function handleSave(values: DesignNameFormValues) {
    const submittedConfiguration = configuration;

    try {
      const savedDesignId = await saveDesign({
        name: values.name,
        configuration: {
          ...configuration,
          productId: configuration.productId as Id<"products">,
        },
      });
      if (
        useCustomizerStore.getState().configuration === submittedConfiguration
      ) {
        markClean();
      }
      setOpen(false);
      toast.success("Design saved to your account.", {
        action: {
          label: "View design",
          onClick: () => router.push(`/account/designs/${savedDesignId}`),
        },
      });
    } catch {
      toast.error("Unable to save this design.");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={handleOpenSave}
        disabled={!authReady}
      >
        <BookmarkCheck aria-hidden="true" />
        Save design
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save design</DialogTitle>
            <DialogDescription>
              Give this configuration a name so you can find it in your account.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSave)}
          >
            <div className="space-y-2">
              <label
                className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase"
                htmlFor="design-name"
              >
                Design name
              </label>
              <Input
                id="design-name"
                autoComplete="off"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-destructive text-sm">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving" : "Save design"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
