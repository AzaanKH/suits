import { describe, expect, it } from "vitest";

import type { CustomizationOption, Product } from "@/types";

import { buildCustomizerCatalog, getUnavailableReason } from "./compatibility";
import {
  getDefaultConfiguration,
  selectSingleOption,
  toggleMultipleOption,
} from "./defaults";
import { calculateConfigurationPrice } from "./pricing";
import { createConfigurationSummary } from "./serialization";

const product: Product = {
  id: "product_house",
  slug: "house-navy-hopsack-suit",
  name: "The House Suit",
  shortDescription: "A house suit.",
  fullDescription: "A house suit.",
  color: "Midnight Navy",
  images: [{ src: "/images/suit-navy.png", alt: "Navy suit" }],
  basePriceCents: 119500,
  featured: true,
  displayOrder: 10,
  category: { id: "business", slug: "business", name: "Business" },
  availableFabrics: [
    {
      id: "fabric_navy",
      code: "navy-hopsack",
      name: "Midnight navy hopsack",
      mill: "VBC",
      color: "Midnight Navy",
      composition: "100% wool",
      weight: "280g",
      seasonality: "Four season",
      description: "Navy cloth.",
    },
    {
      id: "fabric_grey",
      code: "grey-traveller",
      name: "Slate grey traveller wool",
      mill: "Reda",
      color: "Slate Grey",
      composition: "100% wool",
      weight: "270g",
      seasonality: "Four season",
      description: "Grey cloth.",
    },
  ],
};

const groupDetails = {
  "jacket-style": ["group_jacket", "Jacket style", 10],
  lapel: ["group_lapel", "Lapel", 20],
  buttons: ["group_buttons", "Buttons", 30],
  pockets: ["group_pockets", "Pockets", 40],
  trousers: ["group_trousers", "Trousers", 50],
  extras: ["group_extras", "Vest & extras", 60],
} as const;

const options: CustomizationOption[] = [
  option("single-breasted-two-button", "jacket-style", "Single", 0, 10),
  option("double-breasted-six-button", "jacket-style", "Double", 15000, 20),
  option("notch-lapel", "lapel", "Notch", 0, 10, {
    rules: [
      {
        type: "requires",
        groupCode: "jacket-style",
        optionCodes: ["single-breasted-two-button"],
        reason: "Notch requires single-breasted.",
      },
    ],
  }),
  option("peak-lapel", "lapel", "Peak", 7500, 20),
  option("horn-buttons", "buttons", "Horn", 0, 10),
  option("straight-flap-pockets", "pockets", "Straight flap", 0, 10),
  option("patch-pockets", "pockets", "Patch", 0, 20, {
    rules: [
      {
        type: "excludes",
        groupCode: "jacket-style",
        optionCodes: ["double-breasted-six-button"],
        reason: "Patch pockets are not available on double-breasted jackets.",
      },
    ],
  }),
  option("side-adjusters", "trousers", "Side adjusters", 0, 10),
  option("matching-waistcoat", "extras", "Waistcoat", 22500, 10, {
    rules: [
      {
        type: "excludes",
        groupCode: "jacket-style",
        optionCodes: ["double-breasted-six-button"],
        reason: "Waistcoats require a single-breasted jacket.",
      },
    ],
  }),
  option("personal-monogram", "extras", "Monogram", 3500, 20),
];

describe("customizer defaults", () => {
  it("creates a valid default configuration from product and option order", () => {
    const catalog = buildCustomizerCatalog(product, options);
    const configuration = getDefaultConfiguration(catalog);

    expect(configuration.fabricCode).toBe("navy-hopsack");
    expect(configuration.selectedOptionCodes["jacket-style"]).toEqual([
      "single-breasted-two-button",
    ]);
    expect(configuration.selectedOptionCodes.lapel).toEqual(["notch-lapel"]);
    expect(configuration.selectedOptionCodes.extras).toEqual([]);
  });
});

describe("customizer compatibility", () => {
  it("makes incompatible options unavailable from previous selections", () => {
    const catalog = buildCustomizerCatalog(product, options);
    const defaultConfiguration = getDefaultConfiguration(catalog);
    const doubleBreasted = selectSingleOption(
      catalog,
      defaultConfiguration,
      "jacket-style",
      "double-breasted-six-button",
    );
    const notch = catalog.optionsByCode["notch-lapel"];
    const waistcoat = catalog.optionsByCode["matching-waistcoat"];

    expect(doubleBreasted.selectedOptionCodes.lapel).toEqual(["peak-lapel"]);
    expect(getUnavailableReason(notch, doubleBreasted)).toBe(
      "Notch requires single-breasted.",
    );
    expect(getUnavailableReason(waistcoat, doubleBreasted)).toBe(
      "Waistcoats require a single-breasted jacket.",
    );
  });

  it("repairs selected options that become unavailable", () => {
    const catalog = buildCustomizerCatalog(product, options);
    const defaultConfiguration = getDefaultConfiguration(catalog);
    const withPatch = selectSingleOption(
      catalog,
      defaultConfiguration,
      "pockets",
      "patch-pockets",
    );
    const doubleBreasted = selectSingleOption(
      catalog,
      withPatch,
      "jacket-style",
      "double-breasted-six-button",
    );

    expect(doubleBreasted.selectedOptionCodes.pockets).toEqual([
      "straight-flap-pockets",
    ]);
  });
});

describe("customizer pricing", () => {
  it("adds integer-cent modifiers to the product base price", () => {
    const catalog = buildCustomizerCatalog(product, options);
    const defaultConfiguration = getDefaultConfiguration(catalog);
    const doubleBreasted = selectSingleOption(
      catalog,
      defaultConfiguration,
      "jacket-style",
      "double-breasted-six-button",
    );
    const withMonogram = toggleMultipleOption(
      catalog,
      doubleBreasted,
      "extras",
      "personal-monogram",
    );

    expect(calculateConfigurationPrice(catalog, withMonogram)).toMatchObject({
      basePriceCents: 119500,
      modifierTotalCents: 26000,
      totalPriceCents: 145500,
    });
  });
});

describe("customizer serialization", () => {
  it("creates a stable cart-ready configuration summary", () => {
    const catalog = buildCustomizerCatalog(product, options);
    const defaultConfiguration = getDefaultConfiguration(catalog);
    const withMonogram = toggleMultipleOption(
      catalog,
      {
        ...defaultConfiguration,
        personalization: {
          monogramText: "AK",
          notes: "Slightly cleaner trouser break.",
        },
      },
      "extras",
      "personal-monogram",
    );
    const firstSummary = createConfigurationSummary(catalog, withMonogram);
    const secondSummary = createConfigurationSummary(catalog, withMonogram);

    expect(firstSummary).toEqual(secondSummary);
    expect(firstSummary.selectionSignature).toBe(
      "v1|product:house-navy-hopsack-suit|fabric:navy-hopsack|jacket-style:single-breasted-two-button|lapel:notch-lapel|buttons:horn-buttons|pockets:straight-flap-pockets|trousers:side-adjusters|extras:personal-monogram|monogram:AK|notes:Slightly%20cleaner%20trouser%20break.",
    );
    expect(
      firstSummary.selections.map((selection) => selection.optionCode),
    ).toEqual([
      "navy-hopsack",
      "single-breasted-two-button",
      "notch-lapel",
      "horn-buttons",
      "straight-flap-pockets",
      "side-adjusters",
      "personal-monogram",
    ]);
  });
});

function option(
  code: string,
  groupCode: keyof typeof groupDetails,
  label: string,
  priceModifierCents: number,
  displayOrder: number,
  compatibilityMetadata?: unknown,
): CustomizationOption {
  const [groupId, groupLabel, groupDisplayOrder] = groupDetails[groupCode];

  return {
    id: `option_${code}`,
    code,
    label,
    description: `${label} description.`,
    priceModifierCents,
    compatibilityMetadata,
    displayOrder,
    group: {
      id: groupId,
      code: groupCode,
      label: groupLabel,
      description: `${groupLabel} description.`,
      displayOrder: groupDisplayOrder,
    },
  };
}
