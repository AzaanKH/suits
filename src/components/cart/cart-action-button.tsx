"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import type { CustomizerConfiguration } from "@/features/customizer/types";
import { useCustomizerStore } from "@/store/customizer-store";
import {
  type CartFitSelection,
  isCartLineItem,
  useCartStore,
} from "@/store/cart-store";
import { toConvexFitSelection } from "./cart-fit-selection";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type CartEditContext = {
  lineId: string;
  source: "guest" | "authenticated";
  quantity: number;
};

type CartActionButtonProps = {
  configuration: CustomizerConfiguration;
  fitSelection: CartFitSelection;
  editContext: CartEditContext | null;
  disabled?: boolean;
};

export function CartActionButton({
  configuration,
  fitSelection,
  editContext,
  disabled = false,
}: CartActionButtonProps) {
  if (!clerkConfigured) {
    return (
      <LocalCartActionButton
        configuration={configuration}
        fitSelection={fitSelection}
        editContext={editContext}
        disabled={disabled}
      />
    );
  }

  return (
    <ClerkCartActionButton
      configuration={configuration}
      fitSelection={fitSelection}
      editContext={editContext}
      disabled={disabled}
    />
  );
}

function ClerkCartActionButton({
  configuration,
  fitSelection,
  editContext,
  disabled = false,
}: CartActionButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const previewLine = useMutation(api.carts.previewLine);
  const addRemoteLine = useMutation(api.carts.addLine);
  const updateRemoteLine = useMutation(api.carts.updateLine);
  const addLocalLine = useCartStore((state) => state.addItem);
  const updateLocalLine = useCartStore((state) => state.updateItem);
  const markClean = useCustomizerStore((state) => state.markClean);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const authReady = isLoaded && !isLoading;
  const signedIn = isSignedIn && isAuthenticated;
  const label = editContext ? "Update cart" : "Add to cart";

  async function handleCartAction() {
    if (!authReady || pending || disabled) {
      return;
    }

    const quantity = editContext?.quantity ?? 1;
    const submittedConfiguration = configuration;
    const submittedFitSelection = toConvexFitSelection(fitSelection);

    if (fitSelection.fitMethod === "made-to-measure" && !signedIn) {
      toast.error("Sign in to order Made to Measure.");
      router.push("/sign-in");
      return;
    }

    setPending(true);

    try {
      if (signedIn && editContext?.source === "authenticated") {
        await updateRemoteLine({
          lineId: editContext.lineId,
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
          fitSelection: submittedFitSelection,
          quantity,
        });
      } else if (signedIn) {
        await addRemoteLine({
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
          fitSelection: submittedFitSelection,
          quantity,
        });
      } else {
        const line = await previewLine({
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
          fitSelection: submittedFitSelection,
          quantity,
        });

        if (!isCartLineItem(line)) {
          throw new Error("Invalid cart line response.");
        }

        if (editContext?.source === "guest") {
          updateLocalLine(editContext.lineId, line);
        } else {
          addLocalLine(line);
        }
      }

      if (
        useCustomizerStore.getState().configuration === submittedConfiguration
      ) {
        markClean();
      }
      toast.success(editContext ? "Cart item updated." : "Added to cart.");
      router.push("/cart");
    } catch {
      toast.error("Unable to update the cart.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleCartAction}
      disabled={!authReady || pending || disabled}
    >
      <ShoppingBag aria-hidden="true" />
      {label}
    </Button>
  );
}

function LocalCartActionButton({
  configuration,
  fitSelection,
  editContext,
  disabled = false,
}: CartActionButtonProps) {
  const previewLine = useMutation(api.carts.previewLine);
  const addLocalLine = useCartStore((state) => state.addItem);
  const updateLocalLine = useCartStore((state) => state.updateItem);
  const markClean = useCustomizerStore((state) => state.markClean);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = editContext ? "Update cart" : "Add to cart";

  async function handleCartAction() {
    if (pending || disabled) {
      return;
    }

    const quantity = editContext?.quantity ?? 1;
    const submittedConfiguration = configuration;
    const submittedFitSelection = toConvexFitSelection(fitSelection);

    if (fitSelection.fitMethod === "made-to-measure") {
      toast.error("Made to Measure requires an account.");
      return;
    }

    setPending(true);

    try {
      const line = await previewLine({
        configuration: {
          ...configuration,
          productId: configuration.productId as Id<"products">,
        },
        fitSelection: submittedFitSelection,
        quantity,
      });

      if (!isCartLineItem(line)) {
        throw new Error("Invalid cart line response.");
      }

      if (editContext?.source === "guest") {
        updateLocalLine(editContext.lineId, line);
      } else {
        addLocalLine(line);
      }

      if (
        useCustomizerStore.getState().configuration === submittedConfiguration
      ) {
        markClean();
      }
      toast.success(editContext ? "Cart item updated." : "Added to cart.");
      router.push("/cart");
    } catch {
      toast.error("Unable to update the cart.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="lg" onClick={handleCartAction} disabled={pending || disabled}>
      <ShoppingBag aria-hidden="true" />
      {label}
    </Button>
  );
}

export type { CartEditContext };
