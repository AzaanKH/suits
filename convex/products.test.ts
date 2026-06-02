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
