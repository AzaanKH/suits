import { describe, expect, it } from "vitest";

import type { CustomizerConfiguration } from "@/features/customizer/types";

import {
  getSuit3dAssetSelection,
  getSuit3dAssetUrls,
  SUIT_3D_PRODUCT_SLUG,
} from "./asset-contract";

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

describe("3D asset contract", () => {
  it("maps stable customizer option codes to modular GLB assets", () => {
    const selection = getSuit3dAssetSelection(baseConfiguration);

    expect(selection.supportedProduct).toBe(true);
    expect(selection.selectedCodes).toMatchObject({
      fabric: "grey-traveller",
      jacket: "double-breasted-six-button",
      lapel: "peak-lapel",
      buttons: "smoked-pearl-buttons",
    });
    expect(selection.assets.jacket).toMatchObject({
      url: "/models/suit-configurator/jackets/double-breasted-six-button.glb",
      rootNodeName: "Jacket_DoubleBreastedSixButton_Root",
    });
    expect(selection.assets.lapel.meshNames).toEqual([
      "Lapel_Left_Peak",
      "Lapel_Right_Peak",
    ]);
    expect(selection.assets.buttons.meshNames).toEqual([
      "Buttons_SmokedPearl_1",
      "Buttons_SmokedPearl_2",
    ]);
  });

  it("keeps covered buttons in the selected fabric material", () => {
    const selection = getSuit3dAssetSelection({
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
    const selection = getSuit3dAssetSelection({
      ...baseConfiguration,
      productSlug: "travel-slate-grey-suit",
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        lapel: ["unknown-lapel"],
      },
    });

    expect(selection.supportedProduct).toBe(false);
    expect(selection.selectedCodes.lapel).toBe("notch-lapel");
  });

  it("returns each selected asset URL once", () => {
    const selection = getSuit3dAssetSelection(baseConfiguration);

    expect(getSuit3dAssetUrls(selection)).toEqual([
      "/models/suit-configurator/base/mannequin.glb",
      "/models/suit-configurator/jackets/double-breasted-six-button.glb",
      "/models/suit-configurator/lapels/peak-lapel.glb",
      "/models/suit-configurator/buttons/smoked-pearl-buttons.glb",
    ]);
  });
});
