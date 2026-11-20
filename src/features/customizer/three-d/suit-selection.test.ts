import { describe, expect, it } from "vitest";

import type { CustomizerConfiguration } from "@/features/customizer/types";

import {
  getSuit3dSelection,
  getSuitBlock,
  isSuitMeshVisible,
  SUIT_3D_PRODUCT_SLUG,
} from "./suit-selection";

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

describe("3D mesh visibility", () => {
  const withOptions = (
    options: Partial<CustomizerConfiguration["selectedOptionCodes"]>,
  ) =>
    getSuit3dSelection({
      ...baseConfiguration,
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        ...options,
      },
    });

  it("shows only the block for the jacket and lapel", () => {
    const double = withOptions({});
    expect(getSuitBlock(double)).toBe("double");
    expect(isSuitMeshVisible("double_body", double)).toBe(true);
    expect(isSuitMeshVisible("single_body", double)).toBe(false);
    expect(isSuitMeshVisible("double_lapel_peak", double)).toBe(true);
    expect(isSuitMeshVisible("double_lapel_notch", double)).toBe(false);
    expect(isSuitMeshVisible("shirt_button_0", double)).toBe(false);

    const dinner = withOptions({ lapel: ["shawl-lapel"] });
    expect(getSuitBlock(dinner)).toBe("dinner");
    expect(isSuitMeshVisible("dinner_lapel_shawl", dinner)).toBe(true);
    expect(isSuitMeshVisible("double_body", dinner)).toBe(false);
  });

  it("maps pockets and the one-button front", () => {
    const single = withOptions({
      "jacket-style": ["single-breasted-one-button"],
      lapel: ["notch-lapel"],
      pockets: ["jetted-pockets"],
    });
    expect(getSuitBlock(single)).toBe("single");
    expect(isSuitMeshVisible("single_pocket_welt", single)).toBe(true);
    expect(isSuitMeshVisible("single_pocket_flap", single)).toBe(false);
    expect(isSuitMeshVisible("single_button_11", single)).toBe(false);
    expect(isSuitMeshVisible("single_button_10", single)).toBe(true);
    expect(isSuitMeshVisible("shirt_button_0", single)).toBe(true);
  });

  it("follows trouser and waistcoat choices for shared meshes", () => {
    const pleated = withOptions({ trousers: ["single-pleat-trousers"] });
    expect(isSuitMeshVisible("pleat_1_0", pleated)).toBe(true);
    expect(isSuitMeshVisible("pleat_1_1", pleated)).toBe(false);
    expect(isSuitMeshVisible("trousers", pleated)).toBe(true);
    expect(isSuitMeshVisible("waistcoat", pleated)).toBe(false);

    const vested = withOptions({ extras: ["matching-waistcoat"] });
    expect(isSuitMeshVisible("waistcoat", vested)).toBe(true);
    expect(isSuitMeshVisible("vest_button_2", vested)).toBe(true);
  });
});

describe("3D jacket details from Details requests", () => {
  const withRequests = (
    choices: Record<string, string>,
    options: Partial<CustomizerConfiguration["selectedOptionCodes"]> = {},
  ) =>
    getSuit3dSelection({
      ...baseConfiguration,
      selectedOptionCodes: {
        ...baseConfiguration.selectedOptionCodes,
        ...options,
      },
      tailoring: { version: 1, choices, dimensions: {} },
    });
  const single = {
    "jacket-style": ["single-breasted-two-button"],
    lapel: ["notch-lapel"],
  };

  it("drops the top row for a 4×2 double-breasted, and only there", () => {
    const fourByTwo = withRequests({ "front-cut": "db-four" });
    expect(isSuitMeshVisible("double_button_upper_9", fourByTwo)).toBe(false);
    expect(isSuitMeshVisible("double_button_9", fourByTwo)).toBe(true);
    expect(isSuitMeshVisible("double_button_upper_9", withRequests({}))).toBe(
      true,
    );
    // The request means nothing on a single-breasted jacket.
    expect(
      withRequests({ "front-cut": "db-four" }, single).jacketDetails.fourByTwo,
    ).toBe(false);
  });

  it("keeps the sleeve buttons nearest the cuff edge", () => {
    const two = withRequests({ "cuff-button-count": "two" }, single);
    // Right sleeve, from the cuff edge up: 1, 0, 2.
    expect(isSuitMeshVisible("single_button_1", two)).toBe(true);
    expect(isSuitMeshVisible("single_button_0", two)).toBe(true);
    expect(isSuitMeshVisible("single_button_2", two)).toBe(false);
    // The jacket's front buttons are not sleeve buttons.
    expect(isSuitMeshVisible("single_button_10", two)).toBe(true);
    // Four and five need meshes the model lacks: it keeps its own three.
    const four = withRequests({ "cuff-button-count": "four" }, single);
    expect(four.jacketDetails.sleeveButtons).toBeNull();
    expect(isSuitMeshVisible("single_button_2", four)).toBe(true);
  });

  it("hides the breast pocket and lapel buttonhole on request", () => {
    const bare = withRequests(
      { "breast-pocket": "none", "lapel-buttonhole": "none" },
      single,
    );
    expect(isSuitMeshVisible("single_breast", bare)).toBe(false);
    expect(isSuitMeshVisible("single_buttonhole", bare)).toBe(false);
    const standard = withRequests({}, single);
    expect(isSuitMeshVisible("single_breast", standard)).toBe(true);
    expect(isSuitMeshVisible("single_buttonhole", standard)).toBe(true);
  });

  it("carries the lining colour and buttonhole thread", () => {
    const selection = withRequests({
      "lining-color": "burgundy",
      "buttonhole-thread": "ivory",
    });
    expect(selection.liningMaterial.color).toBe("#602d3e");
    expect(selection.jacketDetails.buttonholeThread).toBe("#e6dcc6");
    expect(withRequests({}).jacketDetails.buttonholeThread).toBeNull();
  });
});
