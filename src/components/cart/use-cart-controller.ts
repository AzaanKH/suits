"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";

import { api } from "../../../convex/_generated/api";
import {
  getCartItemCount,
  getCartLineItems,
  getCartSubtotal,
  type CartLineItem,
  useCartStore,
} from "@/store/cart-store";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function useCartController() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const localItems = useCartStore((state) => state.items);
  const updateLocalQuantity = useCartStore((state) => state.updateQuantity);
  const removeLocalItem = useCartStore((state) => state.removeItem);
  const remoteCart = useQuery(
    api.carts.mine,
    clerkConfigured && isAuthenticated ? {} : "skip",
  );
  const updateRemoteQuantity = useMutation(api.carts.updateQuantity);
  const removeRemoteLine = useMutation(api.carts.removeLine);
  const source: "authenticated" | "guest" =
    clerkConfigured && isAuthenticated ? "authenticated" : "guest";
  const items: CartLineItem[] =
    source === "authenticated"
      ? getCartLineItems(remoteCart?.lineItems ?? [])
      : localItems;
  const subtotalCents =
    source === "authenticated"
      ? (remoteCart?.subtotalCents ?? getCartSubtotal(items))
      : getCartSubtotal(items);
  const itemCount =
    source === "authenticated"
      ? (remoteCart?.itemCount ?? getCartItemCount(items))
      : getCartItemCount(items);

  async function updateQuantity(lineId: string, quantity: number) {
    if (source === "authenticated") {
      await updateRemoteQuantity({ lineId, quantity });
      return;
    }

    updateLocalQuantity(lineId, quantity);
  }

  async function removeItem(lineId: string) {
    if (source === "authenticated") {
      await removeRemoteLine({ lineId });
      return;
    }

    removeLocalItem(lineId);
  }

  return {
    source,
    items,
    itemCount,
    subtotalCents,
    loading:
      source === "authenticated" && (isLoading || remoteCart === undefined),
    updateQuantity,
    removeItem,
  };
}

export function toConvexConfiguration(configuration: CartLineItem["configuration"]) {
  return {
    ...configuration,
    productId: configuration.productId as Id<"products">,
  };
}
