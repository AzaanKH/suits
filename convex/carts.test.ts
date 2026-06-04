import { convexTest } from "convex-test";
import type { TestConvexForDataModel } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

type TestConfiguration = {
  version: 1;
  productId: Id<"products">;
  productSlug: string;
  fabricCode: string;
  selectedOptionCodes: Record<string, string[]>;
  personalization: {
    monogramText: string;
    notes: string;
  };
};

describe("carts", () => {
  it("revalidates configured suit pricing on the server", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);

    const line = await t.mutation(api.carts.previewLine, {
      configuration,
      quantity: 2,
    });

    expect(line.productSlug).toBe("house-navy-hopsack-suit");
    expect(line.unitPriceCents).toBe(119500 + 3500 + 3500);
    expect(line.quantity).toBe(2);
    expect(line.personalization).toEqual({
      monogramText: "AK",
      notes: "Cleaner trouser break.",
    });
  });

  it("rejects incompatible options instead of trusting client snapshots", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);

    await expect(
      t.mutation(api.carts.previewLine, {
        configuration: {
          ...configuration,
          selectedOptionCodes: {
            ...configuration.selectedOptionCodes,
            lapel: ["shawl-lapel"],
          },
        },
        quantity: 1,
      }),
    ).rejects.toThrow(
      "Shawl lapels are reserved for one-button evening jackets.",
    );
  });

  it("merges guest cart items into the authenticated cart", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);
    const user = t.withIdentity({
      subject: "user_cart",
      issuer: "https://example.clerk.accounts.dev",
    });

    await user.mutation(api.carts.addLine, {
      configuration,
      quantity: 1,
    });
    await user.mutation(api.carts.mergeGuestCart, {
      items: [
        {
          configuration,
          quantity: 2,
        },
        {
          configuration: {
            ...configuration,
            fabricCode: "grey-traveller",
          },
          quantity: 1,
        },
      ],
    });

    const cart = await user.query(api.carts.mine, {});

    expect(cart.itemCount).toBe(4);
    expect(cart.lineItems).toHaveLength(2);
    expect(cart.lineItems.map((item) => item.quantity).sort()).toEqual([1, 3]);
  });
});

async function buildValidConfiguration(
  t: TestConvexForDataModel<DataModel>,
): Promise<TestConfiguration> {
  const product = await t.run(async (ctx) => {
    const record = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", "house-navy-hopsack-suit"))
      .unique();

    if (!record) {
      throw new Error("Missing test product.");
    }

    return record;
  });

  return {
    version: 1,
    productId: product._id,
    productSlug: product.slug,
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-two-button"],
      lapel: ["notch-lapel"],
      buttons: ["horn-buttons"],
      pockets: ["slanted-flap-pockets"],
      trousers: ["side-adjusters"],
      extras: ["personal-monogram"],
    },
    personalization: {
      monogramText: "ak",
      notes: " Cleaner trouser break. ",
    },
  };
}
