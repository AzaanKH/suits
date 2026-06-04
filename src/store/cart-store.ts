"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  ConfigurationSelectionSummary,
  CustomizerConfiguration,
  CustomizerPersonalization,
} from "@/features/customizer/types";
import type { ProductImage } from "@/types";

export type CartConfigurationSnapshot = Omit<
  CustomizerConfiguration,
  "selectedOptionCodes"
> & {
  selectedOptionCodes: Record<string, string[]>;
};

export type CartLineItem = {
  lineId: string;
  productId: string;
  productSlug: string;
  productName: string;
  previewImageReference?: ProductImage;
  configuration: CartConfigurationSnapshot;
  selections: ConfigurationSelectionSummary[];
  personalization: CustomizerPersonalization;
  unitPriceCents: number;
  quantity: number;
  createdAt: number;
  updatedAt: number;
};

type CartState = {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  updateItem: (lineId: string, item: CartLineItem) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: mergeLineItems(state.items, cloneCartLineItem(item)),
        })),
      updateItem: (lineId, item) =>
        set((state) => ({
          items: mergeLineItems(
            state.items.filter((existingItem) => existingItem.lineId !== lineId),
            cloneCartLineItem(item),
          ),
        })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId
              ? {
                  ...item,
                  quantity: normalizeQuantity(quantity),
                  updatedAt: Date.now(),
                }
              : item,
          ),
        })),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "arden-configured-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function getCartSubtotal(items: CartLineItem[]) {
  return items.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  );
}

export function getCartItemCount(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function mergeLineItems(
  items: CartLineItem[],
  nextItem: CartLineItem,
): CartLineItem[] {
  const existingItem = items.find((item) => item.lineId === nextItem.lineId);

  if (!existingItem) {
    return [...items, nextItem];
  }

  return items.map((item) =>
    item.lineId === nextItem.lineId
      ? {
          ...nextItem,
          quantity: existingItem.quantity + nextItem.quantity,
          createdAt: existingItem.createdAt,
          updatedAt: nextItem.updatedAt,
        }
      : item,
  );
}

function normalizeQuantity(quantity: number) {
  if (!Number.isInteger(quantity)) {
    return 1;
  }

  return Math.min(99, Math.max(1, quantity));
}

function cloneCartLineItem(item: CartLineItem): CartLineItem {
  return JSON.parse(JSON.stringify(item)) as CartLineItem;
}
