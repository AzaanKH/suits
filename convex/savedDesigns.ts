import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuthenticatedClerkUserId } from "./auth";

const personalization = v.object({
  monogramText: v.string(),
  notes: v.string(),
});

const selection = v.object({
  stepCode: v.string(),
  groupLabel: v.string(),
  optionCode: v.string(),
  optionLabel: v.string(),
  priceModifierCents: v.number(),
});

const configuration = v.object({
  version: v.literal(1),
  productSlug: v.string(),
  fabricCode: v.string(),
  selectedOptionCodes: v.record(v.string(), v.array(v.string())),
  personalization,
});

export const save = mutation({
  args: {
    productSlug: v.string(),
    productName: v.string(),
    totalPriceCents: v.number(),
    selectionSignature: v.string(),
    configuration,
    selections: v.array(selection),
    personalization,
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const now = Date.now();
    const productSlug = args.configuration.productSlug;
    const personalization = args.configuration.personalization;

    const existing = await ctx.db
      .query("savedDesigns")
      .withIndex("by_user_signature", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("selectionSignature", args.selectionSignature),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        productSlug,
        productName: args.productName,
        totalPriceCents: args.totalPriceCents,
        configuration: args.configuration,
        selections: args.selections,
        personalization,
        updatedAt: now,
      });

      return existing._id;
    }

    return await ctx.db.insert("savedDesigns", {
      clerkUserId,
      productSlug,
      productName: args.productName,
      totalPriceCents: args.totalPriceCents,
      selectionSignature: args.selectionSignature,
      configuration: args.configuration,
      selections: args.selections,
      personalization,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireAuthenticatedClerkUserId(ctx);

    return await ctx.db
      .query("savedDesigns")
      .withIndex("by_user_updated_at", (q) => q.eq("clerkUserId", clerkUserId))
      .order("desc")
      .take(20);
  },
});
