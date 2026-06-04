import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const design = {
  productSlug: "house-navy-hopsack-suit",
  productName: "The House Suit",
  totalPriceCents: 129500,
  selectionSignature: "v1|product:house-navy-hopsack-suit|fabric:navy",
  configuration: {
    version: 1 as const,
    productSlug: "house-navy-hopsack-suit",
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      jacket: ["single-breasted-two-button"],
      lapel: ["notch-lapel"],
    },
    personalization: {
      monogramText: "",
      notes: "Cleaner trouser break.",
    },
  },
  selections: [
    {
      stepCode: "fabric",
      groupLabel: "Fabric",
      optionCode: "navy-hopsack",
      optionLabel: "Navy hopsack wool",
      priceModifierCents: 0,
    },
  ],
  personalization: {
    monogramText: "",
    notes: "Cleaner trouser break.",
  },
};

describe("saved designs", () => {
  it("requires a Clerk-authenticated Convex identity", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.savedDesigns.save, design)).rejects.toThrow(
      "Authentication required.",
    );
  });

  it("stores saved designs under the Clerk user id", async () => {
    const t = convexTest(schema, modules).withIdentity({
      subject: "user_test123",
      issuer: "https://example.clerk.accounts.dev",
    });

    await t.mutation(api.savedDesigns.save, design);
    const savedDesigns = await t.query(api.savedDesigns.mine);

    expect(savedDesigns).toHaveLength(1);
    expect(savedDesigns[0].clerkUserId).toBe("user_test123");
    expect(savedDesigns[0].productSlug).toBe("house-navy-hopsack-suit");
  });
});
