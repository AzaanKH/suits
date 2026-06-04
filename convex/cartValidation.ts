import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const personalizationValidator = v.object({
  monogramText: v.string(),
  notes: v.string(),
});

export const configurationValidator = v.object({
  version: v.literal(1),
  productId: v.id("products"),
  productSlug: v.string(),
  fabricCode: v.string(),
  selectedOptionCodes: v.record(v.string(), v.array(v.string())),
  personalization: personalizationValidator,
});

export const configurationSelectionValidator = v.object({
  stepCode: v.string(),
  groupLabel: v.string(),
  optionCode: v.string(),
  optionLabel: v.string(),
  priceModifierCents: v.number(),
});

export type CartConfiguration = {
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

export type ValidatedConfiguration = {
  product: Doc<"products">;
  configuration: CartConfiguration;
  selections: Array<{
    stepCode: string;
    groupLabel: string;
    optionCode: string;
    optionLabel: string;
    priceModifierCents: number;
  }>;
  personalization: CartConfiguration["personalization"];
  priceCents: number;
  previewImageReference?: {
    src: string;
    alt: string;
  };
  selectionSignature: string;
};

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

export async function validateConfigurationSnapshot(
  ctx: QueryCtx | MutationCtx,
  configuration: CartConfiguration,
): Promise<ValidatedConfiguration> {
  const product = await ctx.db.get(configuration.productId);

  if (
    !product ||
    !product.active ||
    product.slug !== configuration.productSlug
  ) {
    throw new ConvexError("Invalid product for configuration.");
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
    selectionSignature: createConfigurationSignature(
      product.slug,
      selections,
      personalization,
    ),
  };
}

export function createCartLineId(selectionSignature: string) {
  let hash = 0;

  for (let index = 0; index < selectionSignature.length; index += 1) {
    hash = (hash * 31 + selectionSignature.charCodeAt(index)) | 0;
  }

  return `line_${Math.abs(hash).toString(36)}`;
}

function createConfigurationSignature(
  productSlug: string,
  selections: ValidatedConfiguration["selections"],
  personalization: CartConfiguration["personalization"],
) {
  const selectionParts = selections.map(
    (selection) => `${selection.stepCode}:${selection.optionCode}`,
  );

  return [
    "v1",
    `product:${productSlug}`,
    ...selectionParts,
    `monogram:${stableValue(personalization.monogramText)}`,
    `notes:${stableValue(personalization.notes)}`,
  ].join("|");
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

function validatePersonalization(configuration: CartConfiguration) {
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
  configuration: CartConfiguration,
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

function stableValue(value: string) {
  return encodeURIComponent(value.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
