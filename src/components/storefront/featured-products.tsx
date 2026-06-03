"use client";

import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { EmptyState } from "@/components/storefront/empty-state";
import { ProductGridSkeleton } from "@/components/storefront/loading-skeleton";
import { ProductGrid } from "@/components/storefront/product-grid";

export function FeaturedProducts() {
  const products = useQuery(api.products.featured);

  if (products === undefined) {
    return <ProductGridSkeleton className="mt-11" count={3} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="The collection is being prepared."
        description="Featured suits will appear here after the local storefront seed has been loaded."
        headingTag="h3"
        action={{ label: "Explore all suits", href: "/shop" }}
      />
    );
  }

  return <ProductGrid products={products} className="mt-11" />;
}
