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
  const mergeKey = useMemo(() => createMergeKey(localItems), [localItems]);

  useEffect(() => {
    if (
      !clerkConfigured ||
      !isAuthenticated ||
      isLoading ||
      localItems.length === 0 ||
      !mergeKey ||
      inFlightMergeKey.current !== null
    ) {
      return;
    }

    inFlightMergeKey.current = mergeKey;

    void (async () => {
      try {
        await mergeGuestCart({
          items: localItems.map((item) => ({
            configuration: toConvexConfiguration(item.configuration),
            quantity: item.quantity,
            measurementAppointmentRequired:
              item.measurementAppointmentRequired,
          })),
        });

        if (createMergeKey(useCartStore.getState().items) === mergeKey) {
          clearCart();
        }
      } catch {
        toast.error(
          "Unable to merge your guest cart. Your local cart was kept.",
        );
      } finally {
        inFlightMergeKey.current = null;
      }
    })();
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

function createMergeKey(items: ReturnType<typeof useCartStore.getState>["items"]) {
  return items
    .map((item) => `${item.lineId}:${item.quantity}:${item.updatedAt}`)
    .join("|");
}
