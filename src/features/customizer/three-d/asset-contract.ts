import type { CustomizerConfiguration } from "@/features/customizer/types";

import assetManifest from "./asset-manifest.json";

export const SUIT_3D_PRODUCT_SLUG = "house-navy-hopsack-suit";

export type Suit3dMaterialSlotName = "fabric" | "button" | "lining";

export type Suit3dModelAsset = {
  code: string;
  label: string;
  url: string;
  rootNodeName: string;
  meshNames: string[];
  materialSlots?: Partial<Record<Suit3dMaterialSlotName, string[]>>;
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
    pockets: Suit3dModelAsset;
    trousers: Suit3dModelAsset;
    vest: Suit3dModelAsset | null;
  };
  fabricMaterial: Suit3dMaterial;
  trouserMaterial: Suit3dMaterial;
  vestMaterial: Suit3dMaterial;
  lapelMaterial: Suit3dMaterial;
  trouserDetails: { waist: string; pleats: string } | null;
  buttonMaterial: Suit3dMaterial;
  liningMaterial: Suit3dMaterial;
  selectedCodes: {
    fabric: string;
    jacket: string;
    lapel: string;
    buttons: string;
    pockets: string;
    trousers: string;
    vest: string | null;
  };
};

type Suit3dManifestAsset = Omit<Suit3dModelAsset, "url"> & {
  path: string;
};

type Suit3dAssetManifest = {
  base: Suit3dManifestAsset;
  jackets: Record<string, Suit3dManifestAsset>;
  lapels: Record<string, Suit3dManifestAsset>;
  buttons: Record<string, Suit3dManifestAsset>;
  pockets: Record<string, Suit3dManifestAsset>;
  trousers: Record<string, Suit3dManifestAsset>;
  vests: Record<string, Suit3dManifestAsset>;
};

const typedAssetManifest = assetManifest as Suit3dAssetManifest;
const modelRoot = "/models/suit-configurator";

export const BASE_BODY_ASSET = withModelUrl(typedAssetManifest.base);
export const JACKET_ASSETS = mapManifestAssets(typedAssetManifest.jackets);
export const LAPEL_ASSETS = mapManifestAssets(typedAssetManifest.lapels);
export const BUTTON_ASSETS = mapManifestAssets(typedAssetManifest.buttons);
export const POCKET_ASSETS = mapManifestAssets(typedAssetManifest.pockets);
export const TROUSER_ASSETS = mapManifestAssets(typedAssetManifest.trousers);
export const VEST_ASSETS = mapManifestAssets(typedAssetManifest.vests);

export const FABRIC_MATERIALS = {
  "navy-hopsack": {
    code: "navy-hopsack",
    label: "Midnight Navy",
    materialName: "Fabric_MidnightNavyHopsack",
    color: "#344860",
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

export const LINING_MATERIALS = {
  "midnight-bemberg": {
    code: "midnight-bemberg",
    label: "Midnight lining",
    materialName: "Lining_MidnightBemberg",
    color: "#111827",
    roughness: 0.62,
    metalness: 0.01,
  },
} satisfies Record<string, Suit3dMaterial>;

const fallbackCodes = {
  jacket: "single-breasted-two-button",
  lapel: "notch-lapel",
  buttons: "horn-buttons",
  pockets: "straight-flap-pockets",
  trousers: "side-adjusters",
  fabric: "navy-hopsack",
  lining: "midnight-bemberg",
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
  const pocketCode = getSupportedSelection(
    configuration,
    "pockets",
    POCKET_ASSETS,
    fallbackCodes.pockets,
  );
  const trouserCode = getSupportedSelection(
    configuration,
    "trousers",
    TROUSER_ASSETS,
    fallbackCodes.trousers,
  );
  const referenceVestCode = getSupportedOptionalSelection(
    configuration,
    "extras",
    VEST_ASSETS,
  );
  const vestCode =
    configuration.tailoring?.choices["waistcoat-presence"] === "yes"
      ? "matching-waistcoat"
      : configuration.tailoring?.choices["waistcoat-presence"] === "no"
        ? null
        : referenceVestCode;
  const fabricMaterial =
    getKnownMaterial(FABRIC_MATERIALS, configuration.fabricCode) ??
    FABRIC_MATERIALS[fallbackCodes.fabric];
  const configuredButtonMaterial =
    getKnownMaterial(BUTTON_MATERIALS, buttonCode) ??
    BUTTON_MATERIALS[fallbackCodes.buttons];
  const buttonMaterial =
    buttonCode === "covered-buttons"
      ? {
          ...configuredButtonMaterial,
          color: fabricMaterial.color,
          roughness: fabricMaterial.roughness,
          metalness: fabricMaterial.metalness,
        }
      : configuredButtonMaterial;
  const requests = configuration.tailoring?.choices ?? {};
  const liningColors: Record<string, string> = {
    navy: "#111827",
    burgundy: "#602d3e",
    ivory: "#e1d6be",
    black: "#161616",
    forest: "#244438",
  };
  const liningMaterial =
    requests["lining-color"] && liningColors[requests["lining-color"]]
      ? {
          ...LINING_MATERIALS[fallbackCodes.lining],
          code: requests["lining-color"],
          color: liningColors[requests["lining-color"]],
        }
      : LINING_MATERIALS[fallbackCodes.lining];
  const trouserMaterial =
    getKnownMaterial(FABRIC_MATERIALS, requests["trouser-cloth"]) ??
    fabricMaterial;
  const vestMaterial =
    getKnownMaterial(FABRIC_MATERIALS, requests["waistcoat-cloth"]) ??
    fabricMaterial;
  const facing = requests["lapel-facing"];
  const lapelMaterial =
    facing && facing !== "self"
      ? {
          ...fabricMaterial,
          code: facing,
          materialName: "Facing_" + facing,
          color: facing === "midnight-satin" ? "#111829" : "#151515",
          roughness: facing.includes("satin") ? 0.3 : 0.65,
          metalness: 0,
        }
      : fabricMaterial;
  const trouserDetails =
    requests["waist-treatment"] || requests.pleats
      ? {
          waist:
            requests["waist-treatment"] ??
            (trouserCode === "belt-loops" || trouserCode === "side-adjusters"
              ? trouserCode
              : "plain"),
          pleats:
            requests.pleats ??
            (trouserCode === "single-pleat-trousers" ? "single" : "flat"),
        }
      : null;

  return {
    supportedProduct: configuration.productSlug === SUIT_3D_PRODUCT_SLUG,
    productSlug: configuration.productSlug,
    assets: {
      base: BASE_BODY_ASSET,
      jacket: JACKET_ASSETS[jacketCode],
      lapel: LAPEL_ASSETS[lapelCode],
      buttons: BUTTON_ASSETS[buttonCode],
      pockets: POCKET_ASSETS[pocketCode],
      trousers: TROUSER_ASSETS[trouserCode],
      vest: vestCode ? VEST_ASSETS[vestCode] : null,
    },
    fabricMaterial,
    trouserMaterial,
    vestMaterial,
    lapelMaterial,
    trouserDetails,
    buttonMaterial,
    liningMaterial,
    selectedCodes: {
      fabric: fabricMaterial.code,
      jacket: jacketCode,
      lapel: lapelCode,
      buttons: buttonCode,
      pockets: pocketCode,
      trousers: trouserCode,
      vest: vestCode,
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
      selection.assets.pockets.url,
      selection.assets.trousers.url,
      selection.assets.vest?.url,
    ]),
  ).filter((url): url is string => Boolean(url));
}

function withModelUrl(asset: Suit3dManifestAsset): Suit3dModelAsset {
  const { path, ...modelAsset } = asset;

  return {
    ...modelAsset,
    url: `${modelRoot}/${path}`,
  };
}

function mapManifestAssets(assets: Record<string, Suit3dManifestAsset>) {
  return Object.fromEntries(
    Object.entries(assets).map(([code, asset]) => [code, withModelUrl(asset)]),
  ) as Record<string, Suit3dModelAsset>;
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

function getSupportedOptionalSelection<T extends Record<string, unknown>>(
  configuration: CustomizerConfiguration,
  groupCode: keyof CustomizerConfiguration["selectedOptionCodes"],
  supportedOptions: T,
): Extract<keyof T, string> | null {
  return (
    configuration.selectedOptionCodes[groupCode]?.find(
      (code): code is Extract<keyof T, string> => code in supportedOptions,
    ) ?? null
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
