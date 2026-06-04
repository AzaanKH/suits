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
import { isCartLineItem, useCartStore } from "@/store/cart-store";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type CartEditContext = {
  lineId: string;
  source: "guest" | "authenticated";
  quantity: number;
};

type CartActionButtonProps = {
  configuration: CustomizerConfiguration;
  editContext: CartEditContext | null;
};

export function CartActionButton({
  configuration,
  editContext,
}: CartActionButtonProps) {
  if (!clerkConfigured) {
    return (
      <LocalCartActionButton
        configuration={configuration}
        editContext={editContext}
      />
    );
  }

  return (
    <ClerkCartActionButton
      configuration={configuration}
      editContext={editContext}
    />
  );
}

function ClerkCartActionButton({
  configuration,
  editContext,
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
    if (!authReady || pending) {
      return;
    }

    const quantity = editContext?.quantity ?? 1;
    const submittedConfiguration = configuration;

    setPending(true);

    try {
      if (signedIn && editContext?.source === "authenticated") {
        await updateRemoteLine({
          lineId: editContext.lineId,
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
          quantity,
        });
      } else if (signedIn) {
        await addRemoteLine({
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
          quantity,
        });
      } else {
        const line = await previewLine({
          configuration: {
            ...configuration,
            productId: configuration.productId as Id<"products">,
          },
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

      if (useCustomizerStore.getState().configuration === submittedConfiguration) {
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
    <Button size="lg" onClick={handleCartAction} disabled={!authReady || pending}>
      <ShoppingBag aria-hidden="true" />
      {label}
    </Button>
  );
}

function LocalCartActionButton({
  configuration,
  editContext,
}: CartActionButtonProps) {
  const previewLine = useMutation(api.carts.previewLine);
  const addLocalLine = useCartStore((state) => state.addItem);
  const updateLocalLine = useCartStore((state) => state.updateItem);
  const markClean = useCustomizerStore((state) => state.markClean);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = editContext ? "Update cart" : "Add to cart";

  async function handleCartAction() {
    if (pending) {
      return;
    }

    const quantity = editContext?.quantity ?? 1;
    const submittedConfiguration = configuration;

    setPending(true);

    try {
      const line = await previewLine({
        configuration: {
          ...configuration,
          productId: configuration.productId as Id<"products">,
        },
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

      if (useCustomizerStore.getState().configuration === submittedConfiguration) {
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
    <Button size="lg" onClick={handleCartAction} disabled={pending}>
      <ShoppingBag aria-hidden="true" />
      {label}
    </Button>
  );
}

export type { CartEditContext };
