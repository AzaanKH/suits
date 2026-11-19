"use client";

import { useQuery } from "convex/react";
import { useEffect, useMemo } from "react";

import { api } from "../../../convex/_generated/api";
import { useCustomizerStore } from "@/store/customizer-store";

import { buildCustomizerCatalog } from "./compatibility";

/**
 * Loads a product's customizer catalog and initializes the shared store.
 * The store keeps an existing configuration for the same product, so moving
 * between the customizer and the full-screen studio preserves the design.
 */
export function useCustomizerCatalog(productSlug: string) {
  const customizerData = useQuery(api.products.customizer, { productSlug });
  const initialize = useCustomizerStore((state) => state.initialize);
  const catalog = useMemo(
    () =>
      customizerData?.product
        ? buildCustomizerCatalog(customizerData.product, customizerData.options)
        : null,
    [customizerData],
  );

  useEffect(() => {
    if (catalog) initialize(catalog);
  }, [catalog, initialize]);

  return { customizerData, catalog };
}
