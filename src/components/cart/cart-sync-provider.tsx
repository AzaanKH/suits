"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { api } from "../../../convex/_generated/api";
import { useCartStore } from "@/store/cart-store";
import { toConvexConfiguration } from "./use-cart-controller";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function CartSyncProvider() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const localItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const mergeGuestCart = useMutation(api.carts.mergeGuestCart);
  const inFlightMergeKey = useRef<string | null>(null);
  const mergeKey = useMemo(
    () =>
      localItems
        .map((item) => `${item.lineId}:${item.quantity}:${item.updatedAt}`)
        .join("|"),
    [localItems],
  );

  useEffect(() => {
    if (
      !clerkConfigured ||
      !isAuthenticated ||
      isLoading ||
      localItems.length === 0 ||
      !mergeKey ||
      inFlightMergeKey.current === mergeKey
    ) {
      return;
    }

    inFlightMergeKey.current = mergeKey;

    void mergeGuestCart({
      items: localItems.map((item) => ({
        configuration: toConvexConfiguration(item.configuration),
        quantity: item.quantity,
      })),
    })
      .then(() => {
        if (inFlightMergeKey.current === mergeKey) {
          clearCart();
          inFlightMergeKey.current = null;
        }
      })
      .catch(() => {
        inFlightMergeKey.current = null;
        toast.error(
          "Unable to merge your guest cart. Your local cart was kept.",
        );
      });
  }, [
    clearCart,
    isAuthenticated,
    isLoading,
    localItems,
    mergeGuestCart,
    mergeKey,
  ]);

  return null;
}
