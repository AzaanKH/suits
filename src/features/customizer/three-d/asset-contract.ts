import type { CustomizerConfiguration } from "@/features/customizer/types";

export const SUIT_3D_PRODUCT_SLUG = "house-navy-hopsack-suit";

export type Suit3dModelAsset = {
  code: string;
  label: string;
  url: string;
  rootNodeName: string;
  meshNames: string[];
};

export type Suit3dMaterial = {
  code: string;
  label: string;
  materialName: string;
  color: string;
  roughness: number;
  metalness: number;
};

export type Suit3dAssetSelection = {
  supportedProduct: boolean;
  productSlug: string;
  assets: {
    base: Suit3dModelAsset;
    jacket: Suit3dModelAsset;
    lapel: Suit3dModelAsset;
    buttons: Suit3dModelAsset;
  };
  fabricMaterial: Suit3dMaterial;
  buttonMaterial: Suit3dMaterial;
  selectedCodes: {
    fabric: string;
    jacket: string;
    lapel: string;
    buttons: string;
  };
};

const modelRoot = "/models/suit-configurator";

export const BASE_BODY_ASSET: Suit3dModelAsset = {
  code: "house-mannequin-base",
  label: "Base mannequin",
  url: `${modelRoot}/base/mannequin.glb`,
  rootNodeName: "HouseSuit_Base_Mannequin",
  meshNames: ["Mannequin_Base", "Mannequin_Head", "Mannequin_Stand"],
};

export const JACKET_ASSETS = {
  "single-breasted-two-button": {
    code: "single-breasted-two-button",
    label: "Two-button single-breasted",
    url: `${modelRoot}/jackets/single-breasted-two-button.glb`,
    rootNodeName: "Jacket_SingleBreastedTwoButton_Root",
    meshNames: [
      "Jacket_SingleBreastedTwoButton",
      "Sleeve_Left_SingleBreastedTwoButton",
      "Sleeve_Right_SingleBreastedTwoButton",
    ],
  },
  "single-breasted-one-button": {
    code: "single-breasted-one-button",
    label: "One-button evening",
    url: `${modelRoot}/jackets/single-breasted-one-button.glb`,
    rootNodeName: "Jacket_SingleBreastedOneButton_Root",
    meshNames: [
      "Jacket_SingleBreastedOneButton",
      "Sleeve_Left_SingleBreastedOneButton",
      "Sleeve_Right_SingleBreastedOneButton",
    ],
  },
  "double-breasted-six-button": {
    code: "double-breasted-six-button",
    label: "Six-button double-breasted",
    url: `${modelRoot}/jackets/double-breasted-six-button.glb`,
    rootNodeName: "Jacket_DoubleBreastedSixButton_Root",
    meshNames: [
      "Jacket_DoubleBreastedSixButton",
      "Sleeve_Left_DoubleBreastedSixButton",
      "Sleeve_Right_DoubleBreastedSixButton",
    ],
  },
} satisfies Record<string, Suit3dModelAsset>;

export const LAPEL_ASSETS = {
  "notch-lapel": {
    code: "notch-lapel",
    label: "Notch lapel",
    url: `${modelRoot}/lapels/notch-lapel.glb`,
    rootNodeName: "Lapel_Notch_Root",
    meshNames: ["Lapel_Left_Notch", "Lapel_Right_Notch"],
  },
  "peak-lapel": {
    code: "peak-lapel",
    label: "Peak lapel",
    url: `${modelRoot}/lapels/peak-lapel.glb`,
    rootNodeName: "Lapel_Peak_Root",
    meshNames: ["Lapel_Left_Peak", "Lapel_Right_Peak"],
  },
  "shawl-lapel": {
    code: "shawl-lapel",
    label: "Shawl lapel",
    url: `${modelRoot}/lapels/shawl-lapel.glb`,
    rootNodeName: "Lapel_Shawl_Root",
    meshNames: ["Lapel_Left_Shawl", "Lapel_Right_Shawl"],
  },
} satisfies Record<string, Suit3dModelAsset>;

export const BUTTON_ASSETS = {
  "horn-buttons": {
    code: "horn-buttons",
    label: "Dark horn",
    url: `${modelRoot}/buttons/horn-buttons.glb`,
    rootNodeName: "Buttons_Horn_Root",
    meshNames: ["Buttons_Horn_1", "Buttons_Horn_2"],
  },
  "smoked-pearl-buttons": {
    code: "smoked-pearl-buttons",
    label: "Smoked pearl",
    url: `${modelRoot}/buttons/smoked-pearl-buttons.glb`,
    rootNodeName: "Buttons_SmokedPearl_Root",
    meshNames: ["Buttons_SmokedPearl_1", "Buttons_SmokedPearl_2"],
  },
  "covered-buttons": {
    code: "covered-buttons",
    label: "Self-covered",
    url: `${modelRoot}/buttons/covered-buttons.glb`,
    rootNodeName: "Buttons_Covered_Root",
    meshNames: [
      "Buttons_Covered_1",
      "Buttons_Covered_2",
      "Buttons_Covered_3",
      "Buttons_Covered_4",
    ],
  },
} satisfies Record<string, Suit3dModelAsset>;

export const FABRIC_MATERIALS = {
  "navy-hopsack": {
    code: "navy-hopsack",
    label: "Midnight Navy",
    materialName: "Fabric_MidnightNavyHopsack",
    color: "#17213b",
    roughness: 0.82,
    metalness: 0.02,
  },
  "grey-traveller": {
    code: "grey-traveller",
    label: "Slate Grey",
    materialName: "Fabric_SlateGreyTraveller",
    color: "#59606a",
    roughness: 0.78,
    metalness: 0.01,
  },
  "olive-flannel": {
    code: "olive-flannel",
    label: "Dark Olive",
    materialName: "Fabric_DarkOliveFlannel",
    color: "#39432d",
    roughness: 0.9,
    metalness: 0.01,
  },
  "charcoal-pick-and-pick": {
    code: "charcoal-pick-and-pick",
    label: "Charcoal",
    materialName: "Fabric_CharcoalPickAndPick",
    color: "#2f3233",
    roughness: 0.74,
    metalness: 0.02,
  },
  "midnight-barathea": {
    code: "midnight-barathea",
    label: "Midnight Blue",
    materialName: "Fabric_MidnightBarathea",
    color: "#111829",
    roughness: 0.7,
    metalness: 0.02,
  },
  "stone-wool-linen": {
    code: "stone-wool-linen",
    label: "Warm Stone",
    materialName: "Fabric_StoneWoolLinen",
    color: "#b0a58f",
    roughness: 0.88,
    metalness: 0,
  },
} satisfies Record<string, Suit3dMaterial>;

export const BUTTON_MATERIALS = {
  "horn-buttons": {
    code: "horn-buttons",
    label: "Dark horn",
    materialName: "Buttons_DarkHorn",
    color: "#201611",
    roughness: 0.42,
    metalness: 0.03,
  },
  "smoked-pearl-buttons": {
    code: "smoked-pearl-buttons",
    label: "Smoked pearl",
    materialName: "Buttons_SmokedPearl",
    color: "#a9a7a0",
    roughness: 0.34,
    metalness: 0.08,
  },
  "covered-buttons": {
    code: "covered-buttons",
    label: "Self-covered",
    materialName: "Buttons_SelfCoveredFabric",
    color: "#17213b",
    roughness: 0.82,
    metalness: 0.02,
  },
} satisfies Record<string, Suit3dMaterial>;

const fallbackCodes = {
  jacket: "single-breasted-two-button",
  lapel: "notch-lapel",
  buttons: "horn-buttons",
  fabric: "navy-hopsack",
} as const;

export function getSuit3dAssetSelection(
  configuration: CustomizerConfiguration,
): Suit3dAssetSelection {
  const jacketCode = getSupportedSelection(
    configuration,
    "jacket-style",
    JACKET_ASSETS,
    fallbackCodes.jacket,
  );
  const lapelCode = getSupportedSelection(
    configuration,
    "lapel",
    LAPEL_ASSETS,
    fallbackCodes.lapel,
  );
  const buttonCode = getSupportedSelection(
    configuration,
    "buttons",
    BUTTON_ASSETS,
    fallbackCodes.buttons,
  );
  const fabricMaterial =
    getKnownMaterial(FABRIC_MATERIALS, configuration.fabricCode) ??
    FABRIC_MATERIALS[fallbackCodes.fabric];
  const buttonMaterial =
    buttonCode === "covered-buttons"
      ? {
          ...BUTTON_MATERIALS[buttonCode],
          color: fabricMaterial.color,
          roughness: fabricMaterial.roughness,
          metalness: fabricMaterial.metalness,
        }
      : BUTTON_MATERIALS[buttonCode];

  return {
    supportedProduct: configuration.productSlug === SUIT_3D_PRODUCT_SLUG,
    productSlug: configuration.productSlug,
    assets: {
      base: BASE_BODY_ASSET,
      jacket: JACKET_ASSETS[jacketCode],
      lapel: LAPEL_ASSETS[lapelCode],
      buttons: BUTTON_ASSETS[buttonCode],
    },
    fabricMaterial,
    buttonMaterial,
    selectedCodes: {
      fabric: fabricMaterial.code,
      jacket: jacketCode,
      lapel: lapelCode,
      buttons: buttonCode,
    },
  };
}

export function getSuit3dAssetUrls(selection: Suit3dAssetSelection) {
  return Array.from(
    new Set([
      selection.assets.base.url,
      selection.assets.jacket.url,
      selection.assets.lapel.url,
      selection.assets.buttons.url,
    ]),
  );
}

function getSupportedSelection<T extends Record<string, unknown>>(
  configuration: CustomizerConfiguration,
  groupCode: keyof CustomizerConfiguration["selectedOptionCodes"],
  supportedOptions: T,
  fallbackCode: Extract<keyof T, string>,
): Extract<keyof T, string> {
  return (
    configuration.selectedOptionCodes[groupCode]?.find(
      (code): code is Extract<keyof T, string> => code in supportedOptions,
    ) ?? fallbackCode
  );
}

function getKnownMaterial<T extends Record<string, Suit3dMaterial>>(
  materials: T,
  code: string,
) {
  return Object.prototype.hasOwnProperty.call(materials, code)
    ? materials[code as keyof T]
    : null;
}
