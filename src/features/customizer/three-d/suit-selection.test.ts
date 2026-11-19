import { describe, expect, it } from "vitest";

import type { CustomizerConfiguration } from "@/features/customizer/types";

import { getSuit3dSelection, SUIT_3D_PRODUCT_SLUG } from "./suit-selection";

const baseConfiguration: CustomizerConfiguration = {
  version: 1,
  productId: "product_house",
  productSlug: SUIT_3D_PRODUCT_SLUG,
  fabricCode: "grey-traveller",
  selectedOptionCodes: {
    "jacket-style": ["double-breasted-six-button"],
    lapel: ["peak-lapel"],
    buttons: ["smoked-pearl-buttons"],
    pockets: ["jetted-pockets"],
    trousers: ["single-pleat-trousers"],
    extras: [],
  },
  personalization: {
    monogramText: "",
    notes: "",
  },
};

describe("3D suit selection", () => {
  it("maps stable customizer option codes to studio selections", () => {
    const selection = getSuit3dSelection(baseConfiguration);

    expect(selection.supportedProduct).toBe(true);
    expect(selection.selectedCodes).toMatchObject({
      fabric: "grey-traveller",
      jacket: "double-breasted-six-button",
      lapel: "peak-lapel",
      buttons: "smoked-pearl-buttons",
      pockets: "jetted-pockets",
      trousers: "single-pleat-trousers",
      vest: null,
    });
  });

  it("keeps covered buttons in the selected fabric material", () => {
    const selection = getSuit3dSelection({
      ...baseConfiguration,
      fabricCode: "olive-flannel",
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        buttons: ["covered-buttons"],
      },
    });

    expect(selection.buttonMaterial.color).toBe(selection.fabricMaterial.color);
    expect(selection.buttonMaterial.roughness).toBe(
      selection.fabricMaterial.roughness,
    );
  });

  it("falls back to known proof assets for unsupported products", () => {
    const selection = getSuit3dSelection({
      ...baseConfiguration,
      productSlug: "travel-slate-grey-suit",
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        lapel: ["unknown-lapel"],
        pockets: ["unknown-pockets"],
        trousers: ["unknown-trousers"],
      },
    });

    expect(selection.supportedProduct).toBe(false);
    expect(selection.selectedCodes.lapel).toBe("notch-lapel");
    expect(selection.selectedCodes.pockets).toBe("straight-flap-pockets");
    expect(selection.selectedCodes.trousers).toBe("side-adjusters");
  });

  it("adds the matching waistcoat when the vest extra is selected", () => {
    const selection = getSuit3dSelection({
      ...baseConfiguration,
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        extras: ["matching-waistcoat", "personal-monogram"],
      },
    });

    expect(selection.selectedCodes.vest).toBe("matching-waistcoat");
  });
});
