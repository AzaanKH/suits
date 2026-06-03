"use client";

import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { ProductGridSkeleton } from "@/components/storefront/loading-skeleton";
import { cn } from "@/lib/utils";

import { ProductGrid } from "./product-grid";

type CatalogSort = "featured" | "price-ascending" | "price-descending";

export function ShopCatalog() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("featured");
  const categories = useQuery(api.categories.active);
  const products = useQuery(
    api.products.catalog,
    selectedFilter === "all"
      ? { sort }
      : { categorySlug: selectedFilter, sort },
  );
  const filters = [{ slug: "all", name: "All suits" }, ...(categories ?? [])];

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
                selectedFilter === filter.slug && "text-ink",
              )}
              type="button"
              aria-pressed={selectedFilter === filter.slug}
              key={filter.slug}
              onClick={() => setSelectedFilter(filter.slug)}
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
            onChange={(event) => setSort(event.target.value as CatalogSort)}
          >
            <option value="featured">Featured</option>
            <option value="price-ascending">Price: low to high</option>
            <option value="price-descending">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
        {products === undefined ? (
          <p aria-live="polite">Loading suits...</p>
        ) : (
          <p>
            {products.length} {products.length === 1 ? "suit" : "suits"}
          </p>
        )}
        <p className="hidden sm:block">Made to your measurements</p>
      </div>
      {products === undefined ? (
        <ProductGridSkeleton className="mt-7" />
      ) : products.length === 0 ? (
        <section className="mx-auto max-w-xl py-20 text-center">
          <h2 className="text-ink font-serif text-5xl leading-none">
            No suits found.
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            This collection does not have any active suits yet.
          </p>
          {selectedFilter !== "all" ? (
            <button
              className="button-primary mt-7"
              type="button"
              onClick={() => setSelectedFilter("all")}
            >
              View all suits
            </button>
          ) : null}
        </section>
      ) : (
        <ProductGrid products={products} className="mt-7" />
      )}
    </>
  );
}
