import type { CustomizationGroup, Product, ProductImage } from "@/types";

import type { CustomizerGroupCode } from "./steps";

export type FabricSelectionOption = Product["availableFabrics"][number] & {
  priceModifierCents: number;
};

export type CompatibilityRule = {
  type: "requires" | "excludes";
  groupCode: CustomizerGroupCode | "fabric";
  optionCodes: string[];
  reason: string;
};

export type CustomizerOption = {
  id: string;
  code: string;
  label: string;
  description: string;
  priceModifierCents: number;
  imageReference?: ProductImage;
  compatibilityRules: CompatibilityRule[];
  displayOrder: number;
  group: CustomizationGroup & {
    code: CustomizerGroupCode;
  };
};

export type CustomizerOptionGroup = {
  id: string;
  code: CustomizerGroupCode;
  label: string;
  description: string;
  displayOrder: number;
  options: CustomizerOption[];
};

export type CustomizerCatalog = {
  product: Product;
  fabricOptions: FabricSelectionOption[];
  optionGroups: CustomizerOptionGroup[];
  options: CustomizerOption[];
  optionsByCode: Record<string, CustomizerOption>;
  groupsByCode: Partial<Record<CustomizerGroupCode, CustomizerOptionGroup>>;
};

export type SelectedOptionCodes = Record<CustomizerGroupCode, string[]>;

export type CustomizerPersonalization = {
  monogramText: string;
  notes: string;
};

export type CustomizerConfiguration = {
  version: 1;
  productId: string;
  productSlug: string;
  fabricCode: string;
  selectedOptionCodes: SelectedOptionCodes;
  personalization: CustomizerPersonalization;
};

export type ConfigurationSelectionSummary = {
  stepCode: CustomizerGroupCode | "fabric";
  groupLabel: string;
  optionCode: string;
  optionLabel: string;
  priceModifierCents: number;
};

export type ConfigurationSummary = {
  version: 1;
  productId: string;
  productSlug: string;
  productName: string;
  basePriceCents: number;
  totalPriceCents: number;
  selectionSignature: string;
  selections: ConfigurationSelectionSummary[];
  personalization: CustomizerPersonalization;
};
