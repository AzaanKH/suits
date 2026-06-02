"use client";

import { useState } from "react";

import { categories } from "@/data/products";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

import { ProductGrid } from "./product-grid";

type ShopCatalogProps = {
  products: Product[];
};

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const filteredProducts =
    selectedFilter === "all"
      ? products
      : products.filter((product) => product.categoryId === selectedFilter);
  const sortedProducts = [...filteredProducts].sort((first, second) => {
    if (sort === "price-ascending") {
      return first.basePrice - second.basePrice;
    }

    if (sort === "price-descending") {
      return second.basePrice - first.basePrice;
    }

    return Number(Boolean(second.featured)) - Number(Boolean(first.featured));
  });
  const filters = [{ id: "all", name: "All suits" }, ...categories];

  return (
    <>
      <div className="border-border mt-10 flex flex-col gap-5 border-y py-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold tracking-[0.1em] uppercase"
          aria-label="Filter suits by category"
          role="group"
        >
          {filters.map((filter) => (
            <button
              className={cn(
                "hover:text-ink transition-colors",
                selectedFilter === filter.id && "text-ink",
              )}
              type="button"
              aria-pressed={selectedFilter === filter.id}
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
            >
              {filter.name}
            </button>
          ))}
        </div>
        <label className="text-muted-foreground flex items-center gap-3 text-xs font-bold tracking-[0.1em] uppercase">
          Sort
          <select
            className="border-border bg-background text-ink min-h-10 border px-3 text-xs font-bold tracking-[0.08em] uppercase"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-ascending">Price: low to high</option>
            <option value="price-descending">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
        <p>
          {sortedProducts.length}{" "}
          {sortedProducts.length === 1 ? "suit" : "suits"}
        </p>
        <p className="hidden sm:block">Made to your measurements</p>
      </div>
      <ProductGrid products={sortedProducts} className="mt-7" />
    </>
  );
}
