import type {
  ConfigurationSelectionSummary,
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerOption,
  FabricSelectionOption,
} from "./types";

export type ConfigurationPrice = {
  basePriceCents: number;
  modifierTotalCents: number;
  totalPriceCents: number;
  selectedModifiers: ConfigurationSelectionSummary[];
};

export function calculateConfigurationPrice(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): ConfigurationPrice {
  const selectedModifiers = getSelectedModifierItems(catalog, configuration);
  const modifierTotalCents = selectedModifiers.reduce(
    (total, item) => total + item.priceModifierCents,
    0,
  );

  return {
    basePriceCents: catalog.product.basePriceCents,
    modifierTotalCents,
    totalPriceCents: catalog.product.basePriceCents + modifierTotalCents,
    selectedModifiers,
  };
}

export function getSelectedFabric(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): FabricSelectionOption | null {
  return (
    catalog.fabricOptions.find(
      (fabric) => fabric.code === configuration.fabricCode,
    ) ?? null
  );
}

export function getSelectedOptions(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): CustomizerOption[] {
  return catalog.optionGroups.flatMap((group) => {
    const selectedCodes = new Set(
      configuration.selectedOptionCodes[group.code] ?? [],
    );

    return group.options.filter((option) => selectedCodes.has(option.code));
  });
}

function getSelectedModifierItems(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): ConfigurationSelectionSummary[] {
  const selectedFabric = getSelectedFabric(catalog, configuration);
  const fabricItem: ConfigurationSelectionSummary[] = selectedFabric
    ? [
        {
          stepCode: "fabric",
          groupLabel: "Fabric",
          optionCode: selectedFabric.code,
          optionLabel: selectedFabric.name,
          priceModifierCents: selectedFabric.priceModifierCents,
        },
      ]
    : [];

  return [
    ...fabricItem,
    ...getSelectedOptions(catalog, configuration).map((option) => ({
      stepCode: option.group.code,
      groupLabel: option.group.label,
      optionCode: option.code,
      optionLabel: option.label,
      priceModifierCents: option.priceModifierCents,
    })),
  ];
}
