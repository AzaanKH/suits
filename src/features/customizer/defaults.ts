import { getGroupSelectionMode, type CustomizerGroupCode } from "./steps";
import { getAvailableOptions, isOptionAvailable } from "./compatibility";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerPersonalization,
  SelectedOptionCodes,
} from "./types";

export const emptyPersonalization: CustomizerPersonalization = {
  monogramText: "",
  notes: "",
};

export function createEmptySelectedOptionCodes(): SelectedOptionCodes {
  return {
    "jacket-style": [],
    lapel: [],
    buttons: [],
    pockets: [],
    trousers: [],
    extras: [],
  };
}

export function getDefaultConfiguration(
  catalog: CustomizerCatalog,
): CustomizerConfiguration {
  return normalizeConfiguration(catalog, {
    version: 1,
    productSlug: catalog.product.slug,
    fabricCode: catalog.fabricOptions[0]?.code ?? "",
    selectedOptionCodes: createEmptySelectedOptionCodes(),
    personalization: emptyPersonalization,
  });
}

export function normalizeConfiguration(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): CustomizerConfiguration {
  const selectedOptionCodes = createEmptySelectedOptionCodes();
  const validFabric =
    catalog.fabricOptions.find(
      (fabric) => fabric.code === configuration.fabricCode,
    ) ?? catalog.fabricOptions[0];
  const next: CustomizerConfiguration = {
    version: 1,
    productSlug: catalog.product.slug,
    fabricCode: validFabric?.code ?? "",
    selectedOptionCodes,
    personalization: {
      ...emptyPersonalization,
      ...configuration.personalization,
    },
  };

  for (const group of catalog.optionGroups) {
    const availableOptions = getAvailableOptions(group, next);
    const availableCodes = new Set(
      availableOptions.map((option) => option.code),
    );
    const requestedCodes =
      configuration.selectedOptionCodes[group.code]?.filter((code) =>
        availableCodes.has(code),
      ) ?? [];

    if (getGroupSelectionMode(group.code) === "multiple") {
      next.selectedOptionCodes[group.code] = requestedCodes;
      continue;
    }

    next.selectedOptionCodes[group.code] =
      requestedCodes.length > 0
        ? [requestedCodes[0]]
        : availableOptions[0]
          ? [availableOptions[0].code]
          : [];
  }

  return next;
}

export function selectFabric(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
  fabricCode: string,
) {
  return normalizeConfiguration(catalog, {
    ...configuration,
    fabricCode,
  });
}

export function selectSingleOption(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
  groupCode: CustomizerGroupCode,
  optionCode: string,
) {
  const option = catalog.optionsByCode[optionCode];

  if (!option || option.group.code !== groupCode) {
    return configuration;
  }

  if (!isOptionAvailable(option, configuration)) {
    return configuration;
  }

  return normalizeConfiguration(catalog, {
    ...configuration,
    selectedOptionCodes: {
      ...configuration.selectedOptionCodes,
      [groupCode]: [optionCode],
    },
  });
}

export function toggleMultipleOption(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
  groupCode: CustomizerGroupCode,
  optionCode: string,
) {
  const option = catalog.optionsByCode[optionCode];

  if (!option || option.group.code !== groupCode) {
    return configuration;
  }

  if (!isOptionAvailable(option, configuration)) {
    return configuration;
  }

  const currentCodes = configuration.selectedOptionCodes[groupCode] ?? [];
  const selectedOptionCodes = currentCodes.includes(optionCode)
    ? currentCodes.filter((code) => code !== optionCode)
    : [...currentCodes, optionCode];

  return normalizeConfiguration(catalog, {
    ...configuration,
    selectedOptionCodes: {
      ...configuration.selectedOptionCodes,
      [groupCode]: selectedOptionCodes,
    },
  });
}
