import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";

const catalogSort = v.union(
  v.literal("featured"),
  v.literal("price-ascending"),
  v.literal("price-descending"),
);

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active_featured_display_order", (q) =>
        q.eq("active", true).eq("featured", true),
      )
      .collect();

    return await Promise.all(
      products.map((product) => hydrateProduct(ctx, product)),
    ).then((results) => results.filter((product) => product !== null));
  },
});

export const catalog = query({
  args: {
    categorySlug: v.optional(v.string()),
    sort: v.optional(catalogSort),
  },
  handler: async (ctx, { categorySlug, sort = "featured" }) => {
    const category = categorySlug
      ? await ctx.db
          .query("categories")
          .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
          .unique()
      : null;

    if (categorySlug && (!category || !category.active)) {
      return [];
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_active_display_order", (q) => q.eq("active", true))
      .collect();
    const filteredProducts = category
      ? products.filter((product) => product.categoryId === category._id)
      : products;

    return await Promise.all(
      filteredProducts
        .sort(getCatalogSorter(sort))
        .map((product) => hydrateProduct(ctx, product)),
    ).then((results) => results.filter((product) => product !== null));
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!product || !product.active) {
      return null;
    }

    return await hydrateProduct(ctx, product);
  },
});

export const customizer = query({
  args: { productSlug: v.string() },
  handler: async (ctx, { productSlug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", productSlug))
      .unique();

    if (!product || !product.active) {
      return {
        product: null,
        options: [],
      };
    }

    const hydratedProduct = await hydrateProduct(ctx, product);

    if (!hydratedProduct) {
      return {
        product: null,
        options: [],
      };
    }

    return {
      product: hydratedProduct,
      options: await getCustomizationOptions(ctx, product),
    };
  },
});

export const customizationOptions = query({
  args: { productSlug: v.string() },
  handler: async (ctx, { productSlug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", productSlug))
      .unique();

    if (!product || !product.active) {
      return [];
    }

    return await getCustomizationOptions(ctx, product);
  },
});

async function getCustomizationOptions(
  ctx: QueryCtx,
  product: Doc<"products">,
) {
  const availability = await ctx.db
    .query("productCustomizationAvailability")
    .withIndex("by_product", (q) => q.eq("productId", product._id))
    .collect();
  const options = await Promise.all(
    availability
      .filter((entry) => entry.active)
      .map(async (entry) => {
        const option = await ctx.db.get(entry.customizationOptionId);
        const group = await ctx.db.get(entry.customizationGroupId);

        if (
          !option?.active ||
          !group?.active ||
          option.customizationGroupId !== group._id
        ) {
          return null;
        }

        return {
          id: option._id,
          code: option.code,
          label: option.label,
          description: option.description,
          priceModifierCents: option.priceModifierCents,
          imageReference: option.imageReference,
          compatibilityMetadata: option.compatibilityMetadata,
          displayOrder: option.displayOrder,
          group: {
            id: group._id,
            code: group.code,
            label: group.label,
            description: group.description,
            displayOrder: group.displayOrder,
          },
        };
      }),
  );

  return options
    .filter((option) => option !== null)
    .sort(
      (first, second) =>
        first.group.displayOrder - second.group.displayOrder ||
        first.displayOrder - second.displayOrder,
    );
}

async function hydrateProduct(ctx: QueryCtx, product: Doc<"products">) {
  const [category, availableFabrics] = await Promise.all([
    ctx.db.get(product.categoryId),
    Promise.all(
      product.availableFabricIds.map((fabricId) => ctx.db.get(fabricId)),
    ),
  ]);
  if (!category || !category.active) {
    return null;
  }

  const fabrics = availableFabrics.filter(isActiveFabric);

  if (fabrics.length === 0) {
    return null;
  }

  return {
    id: product._id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    basePriceCents: product.basePriceCents,
    images: product.imageReferences,
    badge: product.badge,
    featured: product.featured,
    displayOrder: product.displayOrder,
    color: fabrics[0]?.color ?? "Made to order",
    category: {
      id: category._id,
      slug: category.slug,
      name: category.name,
    },
    availableFabrics: fabrics.map(
      ({
        _id,
        code,
        name,
        mill,
        color,
        composition,
        weight,
        seasonality,
        description,
        imageReference,
      }) => ({
        id: _id,
        code,
        name,
        mill,
        color,
        composition,
        weight,
        seasonality,
        description,
        imageReference,
      }),
    ),
  };
}

function getCatalogSorter(
  sort: "featured" | "price-ascending" | "price-descending",
) {
  if (sort === "price-ascending") {
    return (first: Doc<"products">, second: Doc<"products">) =>
      first.basePriceCents - second.basePriceCents;
  }

  if (sort === "price-descending") {
    return (first: Doc<"products">, second: Doc<"products">) =>
      second.basePriceCents - first.basePriceCents;
  }

  return (first: Doc<"products">, second: Doc<"products">) =>
    Number(second.featured) - Number(first.featured) ||
    first.displayOrder - second.displayOrder;
}

function isActiveFabric(
  fabric: Doc<"fabrics"> | null,
): fabric is Doc<"fabrics"> & { _id: Id<"fabrics"> } {
  return fabric !== null && fabric.active;
}
