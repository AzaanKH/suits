"use client";

import type { Id } from "../../../convex/_generated/dataModel";

import {
  type CartFitSelection,
  type CartLineItem,
  type StandardFitSelection,
  getCartLineFitSelection,
} from "@/store/cart-store";

export function toConvexFitSelection(fitSelection: CartFitSelection) {
  if (fitSelection.fitMethod === "made-to-measure") {
    return {
      ...fitSelection,
      measurementProfileId: fitSelection.measurementProfileId as
        | Id<"measurementProfiles">
        | undefined,
    };
  }

  return fitSelection;
}

export function toConvexStandardFitSelection(
  item: CartLineItem,
): StandardFitSelection {
  const fitSelection = getCartLineFitSelection(item);

  if (fitSelection.fitMethod !== "standard") {
    throw new Error("Guest cart merge only supports Standard Fit lines.");
  }

  return fitSelection;
}
