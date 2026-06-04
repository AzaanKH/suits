import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedClerkUserId } from "./auth";

const personalization = v.object({
  monogramText: v.string(),
  notes: v.string(),
});

const configuration = v.object({
  version: v.literal(1),
  productId: v.id("products"),
  productSlug: v.string(),
  fabricCode: v.string(),
  selectedOptionCodes: v.record(v.string(), v.array(v.string())),
  personalization,
});

const saveName = v.string();

const singleSelectionGroupCodes = new Set([
  "jacket-style",
  "lapel",
  "buttons",
  "pockets",
  "trousers",
]);
const multipleSelectionGroupCodes = new Set(["extras"]);
const knownGroupCodes = new Set([
  ...singleSelectionGroupCodes,
  ...multipleSelectionGroupCodes,
]);

type SavedConfiguration = {
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

type ValidatedConfiguration = {
  product: Doc<"products">;
  configuration: SavedConfiguration;
  selections: Array<{
    stepCode: string;
    groupLabel: string;
    optionCode: string;
    optionLabel: string;
    priceModifierCents: number;
  }>;
  personalization: SavedConfiguration["personalization"];
  priceCents: number;
  previewImageReference?: {
    src: string;
    alt: string;
  };
};

export const save = mutation({
  args: {
    name: saveName,
    configuration,
  },
  handler: async (ctx, args) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const validated = await validateConfigurationSnapshot(
      ctx,
      args.configuration,
    );
    const now = Date.now();

    return await ctx.db.insert("savedDesigns", {
      ownerClerkUserId,
      productId: validated.product._id,
      productSlug: validated.product.slug,
      productName: validated.product.name,
      name: normalizeName(args.name),
      priceCents: validated.priceCents,
      previewImageReference: validated.previewImageReference,
      configuration: validated.configuration,
      selections: validated.selections,
      personalization: validated.personalization,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);

    return await ctx.db
      .query("savedDesigns")
      .withIndex("by_owner_updated_at", (q) =>
        q.eq("ownerClerkUserId", ownerClerkUserId),
      )
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: {
    designId: v.id("savedDesigns"),
  },
  handler: async (ctx, { designId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const design = await ctx.db.get(designId);

    if (!design || design.ownerClerkUserId !== ownerClerkUserId) {
      return null;
    }

    return design;
  },
});

export const rename = mutation({
  args: {
    designId: v.id("savedDesigns"),
    name: saveName,
  },
  handler: async (ctx, { designId, name }) => {
    const design = await requireOwnedDesign(ctx, designId);
    const now = Date.now();

    await ctx.db.patch(design._id, {
      name: normalizeName(name),
      updatedAt: now,
    });
  },
});

export const duplicate = mutation({
  args: {
    designId: v.id("savedDesigns"),
  },
  handler: async (ctx, { designId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const source = await requireOwnedDesign(ctx, designId, ownerClerkUserId);
    const validated = await validateConfigurationSnapshot(
      ctx,
      source.configuration,
    );
    const now = Date.now();

    return await ctx.db.insert("savedDesigns", {
      ownerClerkUserId,
      productId: validated.product._id,
      productSlug: validated.product.slug,
      productName: validated.product.name,
      name: `${source.name} copy`,
      priceCents: validated.priceCents,
      previewImageReference: validated.previewImageReference,
      configuration: validated.configuration,
      selections: validated.selections,
      personalization: validated.personalization,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    designId: v.id("savedDesigns"),
  },
  handler: async (ctx, { designId }) => {
    const design = await requireOwnedDesign(ctx, designId);

    await ctx.db.delete(design._id);
  },
});

async function requireOwnedDesign(
  ctx: QueryCtx | MutationCtx,
  designId: Id<"savedDesigns">,
  ownerClerkUserId?: string,
) {
  const userId = ownerClerkUserId ?? (await requireAuthenticatedClerkUserId(ctx));
  const design = await ctx.db.get(designId);

  if (!design || design.ownerClerkUserId !== userId) {
    throw new ConvexError("Saved design not found.");
  }

  return design;
}

async function validateConfigurationSnapshot(
  ctx: QueryCtx | MutationCtx,
  configuration: SavedConfiguration,
): Promise<ValidatedConfiguration> {
  const product = await ctx.db.get(configuration.productId);

  if (
    !product ||
    !product.active ||
    product.slug !== configuration.productSlug
  ) {
    throw new ConvexError("Invalid product for saved design.");
  }

  const fabric = await getSelectedFabric(ctx, product, configuration.fabricCode);
  const availableGroups = await getAvailableCustomizationGroups(ctx, product);
  const selectedGroupCodes = Object.keys(configuration.selectedOptionCodes);
  const unknownGroupCode = selectedGroupCodes.find(
    (groupCode) => !knownGroupCodes.has(groupCode),
  );

  if (unknownGroupCode) {
    throw new ConvexError(`Unknown customization group: ${unknownGroupCode}.`);
  }

  validatePersonalization(configuration);

  const selections: ValidatedConfiguration["selections"] = [
    {
      stepCode: "fabric",
      groupLabel: "Fabric",
      optionCode: fabric.code,
      optionLabel: fabric.name,
      priceModifierCents: 0,
    },
  ];
  let modifierTotalCents = 0;

  for (const group of availableGroups) {
    if (!knownGroupCodes.has(group.code)) {
      continue;
    }

    const selectedCodes = configuration.selectedOptionCodes[group.code] ?? [];
    const uniqueSelectedCodes = new Set(selectedCodes);

    if (uniqueSelectedCodes.size !== selectedCodes.length) {
      throw new ConvexError(`Duplicate selections for ${group.label}.`);
    }

    if (
      singleSelectionGroupCodes.has(group.code) &&
      uniqueSelectedCodes.size !== 1
    ) {
      throw new ConvexError(`${group.label} requires one selection.`);
    }

    for (const optionCode of selectedCodes) {
      const option = group.options.find(
        (candidate) => candidate.code === optionCode,
      );

      if (!option) {
        throw new ConvexError(
          `${optionCode} is not available for this product.`,
        );
      }

      const unavailableReason = getUnavailableReason(option, configuration);

      if (unavailableReason) {
        throw new ConvexError(unavailableReason);
      }

      selections.push({
        stepCode: group.code,
        groupLabel: group.label,
        optionCode: option.code,
        optionLabel: option.label,
        priceModifierCents: option.priceModifierCents,
      });
      modifierTotalCents += option.priceModifierCents;
    }
  }

  const monogramSelected = selections.some(
    (selection) => selection.optionCode === "personal-monogram",
  );
  const personalization = {
    monogramText: monogramSelected
      ? configuration.personalization.monogramText.trim().toUpperCase()
      : "",
    notes: configuration.personalization.notes.trim(),
  };
  const sanitizedConfiguration = {
    ...configuration,
    personalization,
  };

  return {
    product,
    configuration: sanitizedConfiguration,
    selections,
    personalization,
    priceCents: product.basePriceCents + modifierTotalCents,
    previewImageReference: fabric.imageReference ?? product.imageReferences[0],
  };
}

async function getSelectedFabric(
  ctx: QueryCtx | MutationCtx,
  product: Doc<"products">,
  fabricCode: string,
) {
  const fabrics = await Promise.all(
    product.availableFabricIds.map((fabricId) => ctx.db.get(fabricId)),
  );
  const fabric = fabrics.find(
    (candidate) => candidate?.active && candidate.code === fabricCode,
  );

  if (!fabric) {
    throw new ConvexError("Selected fabric is not available for this product.");
  }

  return fabric;
}

async function getAvailableCustomizationGroups(
  ctx: QueryCtx | MutationCtx,
  product: Doc<"products">,
) {
  const availability = await ctx.db
    .query("productCustomizationAvailability")
    .withIndex("by_product", (q) => q.eq("productId", product._id))
    .collect();
  const entries = await Promise.all(
    availability
      .filter((entry) => entry.active)
      .map(async (entry) => {
        const [option, group] = await Promise.all([
          ctx.db.get(entry.customizationOptionId),
          ctx.db.get(entry.customizationGroupId),
        ]);

        if (
          !option?.active ||
          !group?.active ||
          option.customizationGroupId !== group._id
        ) {
          return null;
        }

        return {
          group,
          option,
        };
      }),
  );
  const groupsById = new Map<
    Id<"customizationGroups">,
    Doc<"customizationGroups"> & {
      options: Doc<"customizationOptions">[];
    }
  >();

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    const existingGroup = groupsById.get(entry.group._id);

    if (existingGroup) {
      existingGroup.options.push(entry.option);
      continue;
    }

    groupsById.set(entry.group._id, {
      ...entry.group,
      options: [entry.option],
    });
  }

  return Array.from(groupsById.values())
    .map((group) => ({
      ...group,
      options: group.options.sort(
        (first, second) => first.displayOrder - second.displayOrder,
      ),
    }))
    .sort((first, second) => first.displayOrder - second.displayOrder);
}

function validatePersonalization(configuration: SavedConfiguration) {
  const { monogramText, notes } = configuration.personalization;

  if (!/^[A-Za-z]*$/.test(monogramText) || monogramText.length > 3) {
    throw new ConvexError("Monogram must use up to three letters.");
  }

  if (notes.length > 240) {
    throw new ConvexError("Tailoring notes must be 240 characters or fewer.");
  }
}

function getUnavailableReason(
  option: Doc<"customizationOptions">,
  configuration: SavedConfiguration,
) {
  const metadata = option.compatibilityMetadata;

  if (!isRecord(metadata) || !Array.isArray(metadata.rules)) {
    return null;
  }

  for (const rule of metadata.rules) {
    if (!isRecord(rule)) {
      continue;
    }

    const type = rule.type;
    const groupCode = rule.groupCode;
    const optionCodes = rule.optionCodes;

    if (
      (type !== "requires" && type !== "excludes") ||
      typeof groupCode !== "string" ||
      !Array.isArray(optionCodes) ||
      !optionCodes.every((code) => typeof code === "string")
    ) {
      continue;
    }

    const selectedCodes =
      groupCode === "fabric"
        ? [configuration.fabricCode]
        : configuration.selectedOptionCodes[groupCode] ?? [];
    const hasMatchingSelection = optionCodes.some((code) =>
      selectedCodes.includes(code),
    );
    const reason =
      typeof rule.reason === "string"
        ? rule.reason
        : "This option is not compatible with the current selections.";

    if (type === "requires" && !hasMatchingSelection) {
      return reason;
    }

    if (type === "excludes" && hasMatchingSelection) {
      return reason;
    }
  }

  return null;
}

function normalizeName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");

  if (normalized.length < 1 || normalized.length > 80) {
    throw new ConvexError("Use a design name between 1 and 80 characters.");
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
