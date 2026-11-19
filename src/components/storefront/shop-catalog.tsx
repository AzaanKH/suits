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
  const selectedFilterName =
    filters.find((filter) => filter.slug === selectedFilter)?.name ??
    "All suits";

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          aria-label="Filter suits by category"
          role="group"
        >
          {filters.map((filter) => (
            <button
              className={cn(
                "border-border text-muted-foreground hover:border-ink/40 hover:text-ink min-h-10 border px-4 text-xs font-bold tracking-[0.08em] uppercase transition-colors",
                selectedFilter === filter.slug &&
                  "border-ink bg-ink text-ivory hover:text-ivory",
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
        <label className="text-muted-foreground flex flex-col gap-2 text-xs font-bold tracking-[0.1em] uppercase sm:min-w-56">
          Sort suits
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
      <div className="border-border text-muted-foreground mt-6 flex flex-col gap-2 border-t pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        {products === undefined ? (
          <p aria-live="polite">Loading suits...</p>
        ) : (
          <p aria-live="polite">
            Showing {products.length} {products.length === 1 ? "suit" : "suits"}{" "}
            in {selectedFilterName.toLowerCase()}
          </p>
        )}
        <p>Open details or customize directly from any suit.</p>
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
