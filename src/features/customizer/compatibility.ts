import type { CustomizationOption, Product } from "@/types";

import {
  CUSTOMIZER_GROUP_CODES,
  isCustomizerGroupCode,
  type CustomizerGroupCode,
} from "./steps";
import type {
  CompatibilityRule,
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerOption,
  CustomizerOptionGroup,
} from "./types";

type MetadataRecord = Record<string, unknown>;

const fallbackGroupLabels: Record<CustomizerGroupCode, string> = {
  "jacket-style": "Jacket style",
  lapel: "Lapel",
  buttons: "Buttons",
  pockets: "Pockets",
  trousers: "Trousers",
  extras: "Vest & extras",
};

export function buildCustomizerCatalog(
  product: Product,
  options: CustomizationOption[],
): CustomizerCatalog {
  const parsedOptions = options.flatMap((option) => {
    if (!isCustomizerGroupCode(option.group.code)) {
      return [];
    }

    return [
      {
        id: option.id,
        code: option.code,
        label: option.label,
        description: option.description,
        priceModifierCents: option.priceModifierCents,
        imageReference: option.imageReference,
        displayOrder: option.displayOrder,
        compatibilityRules: parseCompatibilityRules(
          option.compatibilityMetadata,
        ),
        group: {
          ...option.group,
          code: option.group.code,
        },
      },
    ];
  });

  const optionGroups = CUSTOMIZER_GROUP_CODES.map((groupCode) => {
    const groupOptions = parsedOptions
      .filter((option) => option.group.code === groupCode)
      .sort((first, second) => first.displayOrder - second.displayOrder);
    const firstOption = groupOptions[0];

    return {
      id: firstOption?.group.id ?? groupCode,
      code: groupCode,
      label: firstOption?.group.label ?? fallbackGroupLabels[groupCode],
      description: firstOption?.group.description ?? "",
      displayOrder:
        firstOption?.group.displayOrder ??
        CUSTOMIZER_GROUP_CODES.indexOf(groupCode) * 10,
      options: groupOptions,
    };
  }).sort((first, second) => first.displayOrder - second.displayOrder);

  return {
    product,
    fabricOptions: product.availableFabrics.map((fabric) => ({
      ...fabric,
      priceModifierCents: 0,
    })),
    optionGroups,
    options: parsedOptions,
    optionsByCode: Object.fromEntries(
      parsedOptions.map((option) => [option.code, option]),
    ),
    groupsByCode: Object.fromEntries(
      optionGroups.map((group) => [group.code, group]),
    ),
  };
}

export function parseCompatibilityRules(
  metadata: unknown,
): CompatibilityRule[] {
  if (!isRecord(metadata) || !Array.isArray(metadata.rules)) {
    return [];
  }

  return metadata.rules.flatMap((rule) => {
    if (!isRecord(rule)) {
      return [];
    }

    const type = rule.type;
    const groupCode = rule.groupCode;
    const optionCodes = rule.optionCodes;

    if (
      (type !== "requires" && type !== "excludes") ||
      !(groupCode === "fabric" || isCustomizerGroupCode(groupCode)) ||
      !Array.isArray(optionCodes) ||
      !optionCodes.every((code) => typeof code === "string")
    ) {
      return [];
    }

    return [
      {
        type,
        groupCode,
        optionCodes,
        reason:
          typeof rule.reason === "string"
            ? rule.reason
            : "This option is not compatible with the current selections.",
      },
    ];
  });
}

export function getAvailableOptions(
  group: CustomizerOptionGroup,
  configuration: CustomizerConfiguration,
) {
  return group.options.filter((option) =>
    isOptionAvailable(option, configuration),
  );
}

export function isOptionAvailable(
  option: CustomizerOption,
  configuration: CustomizerConfiguration,
) {
  return getUnavailableReason(option, configuration) === null;
}

export function getUnavailableReason(
  option: CustomizerOption,
  configuration: CustomizerConfiguration,
) {
  for (const rule of option.compatibilityRules) {
    const selectedCodes =
      rule.groupCode === "fabric"
        ? [configuration.fabricCode]
        : configuration.selectedOptionCodes[rule.groupCode];
    const hasMatchingSelection = rule.optionCodes.some((code) =>
      selectedCodes.includes(code),
    );

    if (rule.type === "requires" && !hasMatchingSelection) {
      return rule.reason;
    }

    if (rule.type === "excludes" && hasMatchingSelection) {
      return rule.reason;
    }
  }

  return null;
}

function isRecord(value: unknown): value is MetadataRecord {
  return typeof value === "object" && value !== null;
}
