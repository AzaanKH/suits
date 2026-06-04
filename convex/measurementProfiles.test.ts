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

const profileInput = {
  name: "Wedding suit",
  units: "cm" as const,
  bodyMeasurements: {
    chest: 101.6,
    waist: 86.4,
    hips: 101.6,
    shoulderWidth: 45.7,
    sleeveLength: 63.5,
    jacketLength: 76.2,
    trouserWaist: 86.4,
    inseam: 78.7,
    outseam: 104.1,
  },
  fitPreferences: {
    jacketFit: "classic" as const,
    trouserFit: "straight" as const,
    shoulderPreference: "natural" as const,
    trouserBreak: "slight" as const,
  },
  notes: "  Slightly lower right shoulder. ",
};

describe("measurement profiles", () => {
  it("normalizes centimeter entries to stored inches", async () => {
    const user = convexTest(schema, modules).withIdentity({
      subject: "user_measurements",
      issuer: "https://example.clerk.accounts.dev",
    });

    const profileId = await user.mutation(
      api.measurementProfiles.create,
      profileInput,
    );
    const profiles = await user.query(api.measurementProfiles.mine, {});
    const profile = profiles.find((candidate) => candidate._id === profileId);

    expect(profile?.ownerClerkUserId).toBe("user_measurements");
    expect(profile?.units).toBe("cm");
    expect(profile?.bodyMeasurementsInches.chest).toBe(40);
    expect(profile?.bodyMeasurementsInches.inseam).toBe(30.98);
    expect(profile?.notes).toBe("Slightly lower right shoulder.");
  });

  it("enforces ownership and clears deleted profile references from carts", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);
    const userA = t.withIdentity({
      subject: "user_a",
      issuer: "https://example.clerk.accounts.dev",
    });
    const userB = t.withIdentity({
      subject: "user_b",
      issuer: "https://example.clerk.accounts.dev",
    });
    const profileId = await userA.mutation(
      api.measurementProfiles.create,
      profileInput,
    );
    const line = await userA.mutation(api.carts.addLine, {
      configuration,
      quantity: 1,
    });

    await expect(
      userB.mutation(api.measurementProfiles.update, {
        profileId,
        ...profileInput,
        name: "Wrong owner",
      }),
    ).rejects.toThrow("Measurement profile not found.");

    await expect(
      userA.query(api.carts.forCheckout, { requireMeasurements: true }),
    ).rejects.toThrow("needs a measurement profile or appointment request");

    await userA.mutation(api.carts.setLineMeasurementChoice, {
      lineId: line.lineId,
      measurementProfileId: profileId,
    });

    const readyCart = await userA.query(api.carts.forCheckout, {
      requireMeasurements: true,
    });

    expect(readyCart.lineItems[0]?.measurementProfileName).toBe("Wedding suit");

    await userA.mutation(api.measurementProfiles.remove, { profileId });

    await expect(
      userA.query(api.carts.forCheckout, { requireMeasurements: true }),
    ).rejects.toThrow("needs a measurement profile or appointment request");
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
      extras: [],
    },
    personalization: {
      monogramText: "",
      notes: "",
    },
  };
}
