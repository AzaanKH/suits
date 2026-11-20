import { convexTest } from "convex-test";
import type { TestConvexForDataModel } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

type TestDesignInput = {
  name: string;
  configuration: {
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
};

describe("saved designs", () => {
  it("preserves broad requests across save and duplicate, but requires a quote for cart", async () => {
    const t = convexTest(schema, modules).withIdentity({
      subject: "user_tailoring",
      issuer: "https://example.clerk.accounts.dev",
    });
    await t.mutation(internal.seed.seed);
    const design = await buildValidDesign(t);
    const tailoring = {
      version: 1 as const,
      choices: {
        pleats: "double",
        "waist-treatment": "belt-loops",
        canvas: "full",
      },
      dimensions: { "inseam-cm": 80.5 },
    };
    const configuration = { ...design.configuration, tailoring };
    const designId = await t.mutation(api.savedDesigns.save, {
      ...design,
      configuration,
    });
    expect(
      (await t.query(api.savedDesigns.get, { designId }))?.configuration
        .tailoring,
    ).toEqual(tailoring);
    const copyId = await t.mutation(api.savedDesigns.duplicate, { designId });
    expect(
      (await t.query(api.savedDesigns.get, { designId: copyId }))?.configuration
        .tailoring,
    ).toEqual(tailoring);
    await expect(
      t.mutation(api.carts.previewLine, {
        configuration,
        quantity: 1,
        fitSelection: {
          fitMethod: "standard",
          jacketSize: "40",
          trouserSize: "32",
          fitPreference: "classic",
        },
      }),
    ).rejects.toThrow("maker quote");
    await expect(
      t.mutation(api.savedDesigns.save, {
        ...design,
        configuration: {
          ...configuration,
          tailoring: { ...tailoring, choices: { canvas: "invalid" } },
        },
      }),
    ).rejects.toThrow("Unknown tailoring choice");
  });
  it("requires a Clerk-authenticated Convex identity", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const design = await buildValidDesign(t);

    await expect(t.mutation(api.savedDesigns.save, design)).rejects.toThrow(
      "Authentication required.",
    );
  });

  it("validates snapshots and recalculates pricing on the server", async () => {
    const t = convexTest(schema, modules).withIdentity({
      subject: "user_test123",
      issuer: "https://example.clerk.accounts.dev",
    });
    await t.mutation(internal.seed.seed);
    const design = await buildValidDesign(t);

    const designId = await t.mutation(api.savedDesigns.save, design);
    const savedDesign = await t.query(api.savedDesigns.get, { designId });

    expect(savedDesign?.ownerClerkUserId).toBe("user_test123");
    expect(savedDesign?.productId).toBe(design.configuration.productId);
    expect(savedDesign?.priceCents).toBe(119500 + 3500 + 3500);
    expect(savedDesign?.personalization).toEqual({
      monogramText: "AK",
      notes: "Cleaner trouser break.",
    });

    await expect(
      t.mutation(api.savedDesigns.save, {
        ...design,
        configuration: {
          ...design.configuration,
          selectedOptionCodes: {
            ...design.configuration.selectedOptionCodes,
            lapel: ["shawl-lapel"],
          },
        },
      }),
    ).rejects.toThrow(
      "Shawl lapels are reserved for one-button evening jackets.",
    );
  });

  it("enforces ownership on reads and mutations", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const design = await buildValidDesign(t);
    const userA = t.withIdentity({
      subject: "user_a",
      issuer: "https://example.clerk.accounts.dev",
    });
    const userB = t.withIdentity({
      subject: "user_b",
      issuer: "https://example.clerk.accounts.dev",
    });

    const designId = await userA.mutation(api.savedDesigns.save, design);

    expect(await userB.query(api.savedDesigns.get, { designId })).toBeNull();
    await expect(
      userB.mutation(api.savedDesigns.rename, {
        designId,
        name: "Stolen name",
      }),
    ).rejects.toThrow("Saved design not found.");
    await expect(
      userB.mutation(api.savedDesigns.duplicate, { designId }),
    ).rejects.toThrow("Saved design not found.");
    await expect(
      userB.mutation(api.savedDesigns.remove, { designId }),
    ).rejects.toThrow("Saved design not found.");

    await userA.mutation(api.savedDesigns.rename, {
      designId,
      name: "Boardroom navy",
    });

    const savedDesign = await userA.query(api.savedDesigns.get, { designId });
    expect(savedDesign?.name).toBe("Boardroom navy");
  });
});

async function buildValidDesign(
  t: TestConvexForDataModel<DataModel>,
): Promise<TestDesignInput> {
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
    name: "Boardroom navy",
    configuration: {
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
    },
  };
}
