import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("storefront product queries", () => {
  it("returns active categories in display order after an idempotent reseed", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);
    await t.mutation(internal.seed.seed);

    const categories = await t.query(api.categories.active);
    const products = await t.query(api.products.catalog, {});

    expect(categories.map((category) => category.slug)).toEqual([
      "business",
      "occasion",
      "seasonal",
    ]);
    expect(products).toHaveLength(6);
  });

  it("returns featured active products in display order", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);

    const products = await t.query(api.products.featured);

    expect(products.map((product) => product.slug)).toEqual([
      "house-navy-hopsack-suit",
      "travel-slate-grey-suit",
      "weekend-dark-olive-flannel-suit",
    ]);
  });

  it("filters catalog products by category and supports price sorting", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);

    const products = await t.query(api.products.catalog, {
      categorySlug: "business",
      sort: "price-descending",
    });

    expect(products.map((product) => product.slug)).toEqual([
      "signature-charcoal-double-breasted-suit",
      "travel-slate-grey-suit",
      "house-navy-hopsack-suit",
    ]);
  });

  it("hydrates a product and its available customization options", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);

    const product = await t.query(api.products.bySlug, {
      slug: "summer-stone-wool-linen-suit",
    });
    const options = await t.query(api.products.customizationOptions, {
      productSlug: "summer-stone-wool-linen-suit",
    });

    expect(product?.availableFabrics[0].code).toBe("stone-wool-linen");
    expect(options.map((option) => option.code)).toContain("half-lined");
    expect(options.map((option) => option.code)).not.toContain("full-lined");
  });

  it("hides products whose category or fabrics are inactive", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);

    await t.run(async (ctx) => {
      const business = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", "business"))
        .unique();

      if (!business) {
        throw new Error("Missing business category");
      }

      await ctx.db.patch(business._id, { active: false });
    });

    expect(
      await t.query(api.products.bySlug, {
        slug: "house-navy-hopsack-suit",
      }),
    ).toBeNull();
    expect(
      (await t.query(api.products.featured)).map((product) => product.slug),
    ).toEqual(["weekend-dark-olive-flannel-suit"]);

    await t.run(async (ctx) => {
      const fabric = await ctx.db
        .query("fabrics")
        .withIndex("by_code", (q) => q.eq("code", "stone-wool-linen"))
        .unique();

      if (!fabric) {
        throw new Error("Missing stone wool-linen fabric");
      }

      await ctx.db.patch(fabric._id, { active: false });
    });

    expect(
      await t.query(api.products.bySlug, {
        slug: "summer-stone-wool-linen-suit",
      }),
    ).toBeNull();
  });

  it("does not return customization options under mismatched groups", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed);

    await t.run(async (ctx) => {
      const product = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) =>
          q.eq("slug", "summer-stone-wool-linen-suit"),
        )
        .unique();
      const halfLined = await ctx.db
        .query("customizationOptions")
        .withIndex("by_code", (q) => q.eq("code", "half-lined"))
        .unique();
      const jacket = await ctx.db
        .query("customizationGroups")
        .withIndex("by_code", (q) => q.eq("code", "jacket"))
        .unique();

      if (!product || !halfLined || !jacket) {
        throw new Error("Missing seed customization data");
      }

      const availability = (
        await ctx.db
          .query("productCustomizationAvailability")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect()
      ).find((entry) => entry.customizationOptionId === halfLined._id);

      if (!availability) {
        throw new Error("Missing half-lined availability");
      }

      await ctx.db.patch(availability._id, {
        customizationGroupId: jacket._id,
      });
    });

    const options = await t.query(api.products.customizationOptions, {
      productSlug: "summer-stone-wool-linen-suit",
    });

    expect(options.map((option) => option.code)).not.toContain("half-lined");
  });

  it("returns empty results for missing catalog data", async () => {
    const t = convexTest(schema, modules);

    expect(await t.query(api.products.featured)).toEqual([]);
    expect(
      await t.query(api.products.bySlug, { slug: "missing-product" }),
    ).toBeNull();
    expect(
      await t.query(api.products.customizationOptions, {
        productSlug: "missing-product",
      }),
    ).toEqual([]);
  });
});
