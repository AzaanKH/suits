import { calculateConfigurationPrice } from "./pricing";
import type {
  ConfigurationSelectionSummary,
  ConfigurationSummary,
  CustomizerCatalog,
  CustomizerConfiguration,
} from "./types";

export function createConfigurationSummary(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): ConfigurationSummary {
  const price = calculateConfigurationPrice(catalog, configuration);
  const selections = price.selectedModifiers;
  const personalization = getSerializablePersonalization(
    selections,
    configuration,
  );

  return {
    version: 1,
    productId: catalog.product.id,
    productSlug: catalog.product.slug,
    productName: catalog.product.name,
    basePriceCents: price.basePriceCents,
    totalPriceCents: price.totalPriceCents,
    selectionSignature: createSelectionSignature(
      selections,
      configuration.productSlug,
      personalization,
    ),
    selections,
    personalization,
  };
}

function createSelectionSignature(
  selections: ConfigurationSelectionSummary[],
  productSlug: string,
  personalization: CustomizerConfiguration["personalization"],
) {
  const selectionParts = selections.map(
    (selection) => `${selection.stepCode}:${selection.optionCode}`,
  );

  return [
    `v1`,
    `product:${productSlug}`,
    ...selectionParts,
    `monogram:${stableValue(personalization.monogramText)}`,
    `notes:${stableValue(personalization.notes)}`,
  ].join("|");
}

function getSerializablePersonalization(
  selections: ConfigurationSelectionSummary[],
  configuration: CustomizerConfiguration,
) {
  const monogramSelected = selections.some(
    (selection) => selection.optionCode === "personal-monogram",
  );

  return {
    monogramText: monogramSelected
      ? configuration.personalization.monogramText
      : "",
    notes: configuration.personalization.notes,
  };
}

function stableValue(value: string) {
  return encodeURIComponent(value.trim());
}
