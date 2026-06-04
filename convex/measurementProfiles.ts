import { ConvexError, v } from "convex/values";

import { requireAuthenticatedClerkUserId } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const unitsValidator = v.union(v.literal("in"), v.literal("cm"));
const measurementsValidator = v.object({
  chest: v.number(),
  waist: v.number(),
  hips: v.number(),
  shoulderWidth: v.number(),
  sleeveLength: v.number(),
  jacketLength: v.number(),
  trouserWaist: v.number(),
  inseam: v.number(),
  outseam: v.number(),
});
const fitPreferencesValidator = v.object({
  jacketFit: v.union(
    v.literal("slim"),
    v.literal("classic"),
    v.literal("relaxed"),
  ),
  trouserFit: v.union(
    v.literal("tapered"),
    v.literal("straight"),
    v.literal("relaxed"),
  ),
  shoulderPreference: v.union(
    v.literal("natural"),
    v.literal("structured"),
    v.literal("soft"),
  ),
  trouserBreak: v.union(
    v.literal("none"),
    v.literal("slight"),
    v.literal("medium"),
    v.literal("full"),
  ),
});

const profileInputValidator = {
  name: v.string(),
  units: unitsValidator,
  bodyMeasurements: measurementsValidator,
  fitPreferences: fitPreferencesValidator,
  notes: v.string(),
};

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);

    return await ctx.db
      .query("measurementProfiles")
      .withIndex("by_owner_updated_at", (q) =>
        q.eq("ownerClerkUserId", ownerClerkUserId),
      )
      .order("desc")
      .take(25);
  },
});

export const create = mutation({
  args: profileInputValidator,
  handler: async (ctx, args) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const now = Date.now();

    return await ctx.db.insert("measurementProfiles", {
      ownerClerkUserId,
      name: normalizeName(args.name),
      units: args.units,
      bodyMeasurementsInches: normalizeMeasurements(
        args.bodyMeasurements,
        args.units,
      ),
      fitPreferences: args.fitPreferences,
      notes: normalizeNotes(args.notes),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    profileId: v.id("measurementProfiles"),
    ...profileInputValidator,
  },
  handler: async (ctx, args) => {
    const profile = await requireOwnedProfile(ctx, args.profileId);
    const now = Date.now();

    await ctx.db.patch(profile._id, {
      name: normalizeName(args.name),
      units: args.units,
      bodyMeasurementsInches: normalizeMeasurements(
        args.bodyMeasurements,
        args.units,
      ),
      fitPreferences: args.fitPreferences,
      notes: normalizeNotes(args.notes),
      updatedAt: now,
    });

    await updateCartProfileName(ctx, profile._id, normalizeName(args.name), now);
  },
});

export const duplicate = mutation({
  args: {
    profileId: v.id("measurementProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const source = await requireOwnedProfile(ctx, profileId, ownerClerkUserId);
    const now = Date.now();

    return await ctx.db.insert("measurementProfiles", {
      ownerClerkUserId,
      name: normalizeName(`${source.name} copy`),
      units: source.units,
      bodyMeasurementsInches: source.bodyMeasurementsInches,
      fitPreferences: source.fitPreferences,
      notes: source.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    profileId: v.id("measurementProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    const profile = await requireOwnedProfile(ctx, profileId);

    await ctx.db.delete(profile._id);
    await clearCartProfileReferences(ctx, profile._id);
  },
});

export async function requireOwnedProfile(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"measurementProfiles">,
  ownerClerkUserId?: string,
) {
  const userId = ownerClerkUserId ?? (await requireAuthenticatedClerkUserId(ctx));
  const profile = await ctx.db.get(profileId);

  if (!profile || profile.ownerClerkUserId !== userId) {
    throw new ConvexError("Measurement profile not found.");
  }

  return profile;
}

function normalizeName(name: string) {
  const trimmed = name.trim();

  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new ConvexError("Profile name must be between 2 and 80 characters.");
  }

  return trimmed;
}

function normalizeNotes(notes: string) {
  const trimmed = notes.trim();

  if (trimmed.length > 500) {
    throw new ConvexError("Measurement notes must be 500 characters or fewer.");
  }

  return trimmed;
}

function normalizeMeasurements(
  measurements: Record<string, number>,
  units: "in" | "cm",
) {
  const normalized = {
    chest: normalizeMeasurement("Chest", measurements.chest, units),
    waist: normalizeMeasurement("Waist", measurements.waist, units),
    hips: normalizeMeasurement("Hips", measurements.hips, units),
    shoulderWidth: normalizeMeasurement(
      "Shoulder width",
      measurements.shoulderWidth,
      units,
    ),
    sleeveLength: normalizeMeasurement(
      "Sleeve length",
      measurements.sleeveLength,
      units,
    ),
    jacketLength: normalizeMeasurement(
      "Jacket length",
      measurements.jacketLength,
      units,
    ),
    trouserWaist: normalizeMeasurement(
      "Trouser waist",
      measurements.trouserWaist,
      units,
    ),
    inseam: normalizeMeasurement("Inseam", measurements.inseam, units),
    outseam: normalizeMeasurement("Outseam", measurements.outseam, units),
  };

  if (normalized.inseam >= normalized.outseam) {
    throw new ConvexError("Inseam must be shorter than outseam.");
  }

  return normalized;
}

function normalizeMeasurement(label: string, value: number, units: "in" | "cm") {
  if (!Number.isFinite(value)) {
    throw new ConvexError(`${label} is required.`);
  }

  const inches = units === "cm" ? value / 2.54 : value;
  const rounded = Math.round(inches * 100) / 100;

  if (rounded < 8 || rounded > 90) {
    throw new ConvexError(`${label} must be a realistic body measurement.`);
  }

  return rounded;
}

async function updateCartProfileName(
  ctx: MutationCtx,
  profileId: Id<"measurementProfiles">,
  name: string,
  now: number,
) {
  const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
  const cart = await ctx.db
    .query("carts")
    .withIndex("by_owner", (q) => q.eq("ownerClerkUserId", ownerClerkUserId))
    .unique();

  if (!cart) {
    return;
  }

  await ctx.db.patch(cart._id, {
    lineItems: cart.lineItems.map((lineItem) =>
      lineItem.measurementProfileId === profileId
        ? { ...lineItem, measurementProfileName: name, updatedAt: now }
        : lineItem,
    ),
    updatedAt: now,
  });
}

async function clearCartProfileReferences(
  ctx: MutationCtx,
  profileId: Id<"measurementProfiles">,
) {
  const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
  const cart = await ctx.db
    .query("carts")
    .withIndex("by_owner", (q) => q.eq("ownerClerkUserId", ownerClerkUserId))
    .unique();

  if (!cart) {
    return;
  }

  const now = Date.now();

  await ctx.db.patch(cart._id, {
    lineItems: cart.lineItems.map((lineItem) => {
      if (lineItem.measurementProfileId !== profileId) {
        return lineItem;
      }

      const remainingLineItem = { ...lineItem };
      delete remainingLineItem.measurementProfileId;
      delete remainingLineItem.measurementProfileName;
      delete remainingLineItem.measurementAppointmentRequired;

      return { ...remainingLineItem, updatedAt: now };
    }),
    updatedAt: now,
  });
}
