"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  ConfigurationSelectionSummary,
  CustomizerConfiguration,
  CustomizerPersonalization,
} from "@/features/customizer/types";
import type { ProductImage } from "@/types";

export const STANDARD_FIT_PREFERENCES = [
  "slim",
  "classic",
  "relaxed",
] as const;

export type StandardFitPreference = (typeof STANDARD_FIT_PREFERENCES)[number];

export type StandardFitSelection = {
  fitMethod: "standard";
  jacketSize: string;
  trouserSize?: string;
  trouserWaist?: string;
  trouserInseam?: string;
  fitPreference: StandardFitPreference;
};

export type MadeToMeasureFitSelection = {
  fitMethod: "made-to-measure";
  measurementProfileId?: string;
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
};

export type CartFitSelection =
  | StandardFitSelection
  | MadeToMeasureFitSelection;

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
  fitMethod: CartFitSelection["fitMethod"];
  jacketSize?: string;
  trouserSize?: string;
  trouserWaist?: string;
  trouserInseam?: string;
  fitPreference?: StandardFitPreference;
  measurementProfileId?: string;
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
  createdAt: number;
  updatedAt: number;
};

type CartState = {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  updateItem: (lineId: string, item: CartLineItem) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  setMeasurementChoice: (
    lineId: string,
    choice: {
      measurementProfileId?: string;
      measurementProfileName?: string;
      measurementAppointmentRequired?: boolean;
    },
  ) => void;
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
      setMeasurementChoice: (lineId, choice) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.lineId !== lineId) {
              return item;
            }

            const remainingItem = { ...item };
            delete remainingItem.measurementProfileId;
            delete remainingItem.measurementProfileName;
            delete remainingItem.measurementAppointmentRequired;

            return {
              ...remainingItem,
              ...choice,
              updatedAt: Date.now(),
            };
          }),
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
      version: 2,
      migrate: () => [],
    },
  ),
);

export function createDefaultStandardFitSelection(): StandardFitSelection {
  return {
    fitMethod: "standard",
    jacketSize: "40R",
    trouserWaist: "32",
    trouserInseam: "32",
    fitPreference: "classic",
  };
}

export function getCartLineFitSelection(
  item: CartLineItem,
): CartFitSelection {
  if (item.fitMethod === "made-to-measure") {
    return {
      fitMethod: "made-to-measure",
      ...(item.measurementProfileId
        ? { measurementProfileId: item.measurementProfileId }
        : {}),
      ...(item.measurementProfileName
        ? { measurementProfileName: item.measurementProfileName }
        : {}),
      ...(item.measurementAppointmentRequired
        ? { measurementAppointmentRequired: true }
        : {}),
    };
  }

  return {
    fitMethod: "standard",
    jacketSize: item.jacketSize ?? "",
    ...(item.trouserSize ? { trouserSize: item.trouserSize } : {}),
    ...(item.trouserWaist ? { trouserWaist: item.trouserWaist } : {}),
    ...(item.trouserInseam ? { trouserInseam: item.trouserInseam } : {}),
    fitPreference: item.fitPreference ?? "classic",
  };
}

export function getCartSubtotal(items: CartLineItem[]) {
  return items.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  );
}

export function getCartItemCount(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function isCartLineItem(value: unknown): value is CartLineItem {
  if (!isRecord(value)) {
    return false;
  }

  const configuration = value.configuration;

  return (
    typeof value.lineId === "string" &&
    typeof value.productId === "string" &&
    typeof value.productSlug === "string" &&
    typeof value.productName === "string" &&
    isConfigurationSnapshot(configuration) &&
    Array.isArray(value.selections) &&
    isPersonalization(value.personalization) &&
    Number.isInteger(value.unitPriceCents) &&
    Number.isInteger(value.quantity) &&
    isCartFitSelection(value) &&
    Number.isInteger(value.createdAt) &&
    Number.isInteger(value.updatedAt)
  );
}

export function getCartLineItems(values: readonly unknown[]) {
  return values.filter(isCartLineItem);
}

function mergeLineItems(
  items: CartLineItem[],
  nextItem: CartLineItem,
): CartLineItem[] {
  const existingItem = items.find((item) => item.lineId === nextItem.lineId);

  if (!existingItem) {
    return [
      ...items,
      {
        ...nextItem,
        quantity: normalizeQuantity(nextItem.quantity),
      },
    ];
  }

  return items.map((item) =>
    item.lineId === nextItem.lineId
      ? {
          ...nextItem,
          quantity: normalizeQuantity(existingItem.quantity + nextItem.quantity),
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

function isConfigurationSnapshot(
  value: unknown,
): value is CartConfigurationSnapshot {
  if (!isRecord(value) || !isRecord(value.selectedOptionCodes)) {
    return false;
  }

  return (
    value.version === 1 &&
    typeof value.productId === "string" &&
    typeof value.productSlug === "string" &&
    typeof value.fabricCode === "string" &&
    Object.values(value.selectedOptionCodes).every(
      (codes) =>
        Array.isArray(codes) &&
        codes.every((code) => typeof code === "string"),
    ) &&
    isPersonalization(value.personalization)
  );
}

function isPersonalization(value: unknown): value is CustomizerPersonalization {
  return (
    isRecord(value) &&
    typeof value.monogramText === "string" &&
    typeof value.notes === "string"
  );
}

function isCartFitSelection(value: Record<string, unknown>) {
  if (value.fitMethod === "standard") {
    const hasTrouserSize = optionalString(value.trouserSize)
      ? typeof value.trouserSize === "string" && value.trouserSize.length > 0
      : false;
    const hasWaistInseam =
      typeof value.trouserWaist === "string" &&
      value.trouserWaist.length > 0 &&
      typeof value.trouserInseam === "string" &&
      value.trouserInseam.length > 0;

    return (
      typeof value.jacketSize === "string" &&
      value.jacketSize.length > 0 &&
      optionalString(value.trouserSize) &&
      optionalString(value.trouserWaist) &&
      optionalString(value.trouserInseam) &&
      STANDARD_FIT_PREFERENCES.includes(
        value.fitPreference as StandardFitPreference,
      ) &&
      (hasTrouserSize || hasWaistInseam) &&
      optionalString(value.measurementProfileId) &&
      optionalString(value.measurementProfileName) &&
      optionalBoolean(value.measurementAppointmentRequired)
    );
  }

  if (value.fitMethod === "made-to-measure") {
    return (
      optionalString(value.jacketSize) &&
      optionalString(value.trouserSize) &&
      optionalString(value.trouserWaist) &&
      optionalString(value.trouserInseam) &&
      optionalString(value.fitPreference) &&
      optionalString(value.measurementProfileId) &&
      optionalString(value.measurementProfileName) &&
      optionalBoolean(value.measurementAppointmentRequired) &&
      Boolean(value.measurementProfileId || value.measurementAppointmentRequired)
    );
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function optionalBoolean(value: unknown) {
  return value === undefined || typeof value === "boolean";
}
