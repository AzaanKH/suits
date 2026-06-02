"use client";

import { useState } from "react";

import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

import { ProductGrid } from "./product-grid";

const filters = [
  "All suits",
  "Core Collection",
  "Seasonal Edit",
  "Signature Collection",
  "Evening",
] as const;

type ShopCatalogProps = {
  products: Product[];
};

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof filters)[number]>("All suits");
  const filteredProducts =
    selectedFilter === "All suits"
      ? products
      : products.filter(
          (product) =>
            product.category.toLowerCase() === selectedFilter.toLowerCase(),
        );

  return (
    <>
      <div
        className="border-border text-muted-foreground mt-10 flex flex-wrap gap-x-6 gap-y-3 border-y py-4 text-sm font-bold tracking-[0.08em] uppercase"
        aria-label="Filter suits by collection"
        role="group"
      >
        {filters.map((filter) => (
          <button
            className={cn(
              "hover:text-ink transition-colors",
              selectedFilter === filter && "text-ink",
            )}
            type="button"
            aria-pressed={selectedFilter === filter}
            key={filter}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <ProductGrid products={filteredProducts} className="mt-10" />
    </>
  );
}
