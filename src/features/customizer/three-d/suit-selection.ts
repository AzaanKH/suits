import type { CustomizerConfiguration } from "@/features/customizer/types";

export const SUIT_3D_PRODUCT_SLUG = "house-navy-hopsack-suit";

export type Suit3dMaterial = {
  code: string;
  label: string;
  materialName: string;
  color: string;
  roughness: number;
  metalness: number;
  sheen?: number;
  weave?: number;
};

export type Suit3dJacketDetails = {
  breastPocket: boolean;
  sleeveButtons: number | null;
  fourByTwo: boolean;
  lapelButtonhole: boolean;
  buttonholeThread: string | null;
};

export type Suit3dSelection = {
  supportedProduct: boolean;
  productSlug: string;
  fabricMaterial: Suit3dMaterial;
  trouserMaterial: Suit3dMaterial;
  vestMaterial: Suit3dMaterial;
  lapelMaterial: Suit3dMaterial;
  trouserDetails: { waist: string; pleats: string } | null;
  buttonMaterial: Suit3dMaterial;
  liningMaterial: Suit3dMaterial;
  jacketDetails: Suit3dJacketDetails;
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

const SUPPORTED_CODES = {
  jacket: [
    "single-breasted-two-button",
    "single-breasted-one-button",
    "double-breasted-six-button",
  ],
  lapel: ["notch-lapel", "peak-lapel", "shawl-lapel"],
  buttons: ["horn-buttons", "smoked-pearl-buttons", "covered-buttons"],
  pockets: [
    "straight-flap-pockets",
    "slanted-flap-pockets",
    "patch-pockets",
    "jetted-pockets",
  ],
  trousers: [
    "side-adjusters",
    "belt-loops",
    "single-pleat-trousers",
    "brace-buttons",
  ],
  vest: ["matching-waistcoat"],
} as const;

export const FABRIC_MATERIALS = {
  "navy-hopsack": {
    code: "navy-hopsack",
    label: "Midnight Navy",
    materialName: "Fabric_MidnightNavyHopsack",
    color: "#344860",
    roughness: 0.82,
    metalness: 0.02,
    sheen: 0.35,
    weave: 0.35,
  },
  "grey-traveller": {
    code: "grey-traveller",
    label: "Slate Grey",
    materialName: "Fabric_SlateGreyTraveller",
    color: "#59606a",
    roughness: 0.78,
    metalness: 0.01,
    sheen: 0.4,
    weave: 0.3,
  },
  "olive-flannel": {
    code: "olive-flannel",
    label: "Dark Olive",
    materialName: "Fabric_DarkOliveFlannel",
    color: "#39432d",
    roughness: 0.9,
    metalness: 0.01,
    sheen: 0.6,
    weave: 0.15,
  },
  "charcoal-pick-and-pick": {
    code: "charcoal-pick-and-pick",
    label: "Charcoal",
    materialName: "Fabric_CharcoalPickAndPick",
    color: "#2f3233",
    roughness: 0.74,
    metalness: 0.02,
    sheen: 0.35,
    weave: 0.4,
  },
  "midnight-barathea": {
    code: "midnight-barathea",
    label: "Midnight Blue",
    materialName: "Fabric_MidnightBarathea",
    color: "#111829",
    roughness: 0.7,
    metalness: 0.02,
    sheen: 0.5,
    weave: 0.25,
  },
  "stone-wool-linen": {
    code: "stone-wool-linen",
    label: "Warm Stone",
    materialName: "Fabric_StoneWoolLinen",
    color: "#b0a58f",
    roughness: 0.88,
    metalness: 0,
    sheen: 0.25,
    weave: 0.5,
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

const BUTTONHOLE_THREADS: Record<string, string> = {
  ivory: "#e6dcc6",
  burgundy: "#6b2433",
  navy: "#1c2a4a",
};

const fallbackCodes = {
  jacket: "single-breasted-two-button",
  lapel: "notch-lapel",
  buttons: "horn-buttons",
  pockets: "straight-flap-pockets",
  trousers: "side-adjusters",
  fabric: "navy-hopsack",
  lining: "midnight-bemberg",
} as const;

export function getSuit3dSelection(
  configuration: CustomizerConfiguration,
): Suit3dSelection {
  const jacketCode = getSupportedSelection(
    configuration,
    "jacket-style",
    SUPPORTED_CODES.jacket,
    fallbackCodes.jacket,
  );
  const lapelCode = getSupportedSelection(
    configuration,
    "lapel",
    SUPPORTED_CODES.lapel,
    fallbackCodes.lapel,
  );
  const buttonCode = getSupportedSelection(
    configuration,
    "buttons",
    SUPPORTED_CODES.buttons,
    fallbackCodes.buttons,
  );
  const pocketCode = getSupportedSelection(
    configuration,
    "pockets",
    SUPPORTED_CODES.pockets,
    fallbackCodes.pockets,
  );
  const trouserCode = getSupportedSelection(
    configuration,
    "trousers",
    SUPPORTED_CODES.trousers,
    fallbackCodes.trousers,
  );
  const referenceVestCode = getSupportedOptionalSelection(
    configuration,
    "extras",
    SUPPORTED_CODES.vest,
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

  const sleeveCounts: Record<string, number> = { one: 1, two: 2, three: 3 };
  const jacketDetails: Suit3dJacketDetails = {
    breastPocket: requests["breast-pocket"] !== "none",
    sleeveButtons: sleeveCounts[requests["cuff-button-count"] ?? ""] ?? null,
    fourByTwo:
      jacketCode === "double-breasted-six-button" &&
      requests["front-cut"] === "db-four",
    lapelButtonhole: requests["lapel-buttonhole"] !== "none",
    buttonholeThread:
      BUTTONHOLE_THREADS[requests["buttonhole-thread"] ?? ""] ?? null,
  };

  return {
    supportedProduct: configuration.productSlug === SUIT_3D_PRODUCT_SLUG,
    productSlug: configuration.productSlug,
    fabricMaterial,
    trouserMaterial,
    vestMaterial,
    lapelMaterial,
    trouserDetails,
    buttonMaterial,
    liningMaterial,
    jacketDetails,
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

function getSupportedSelection<T extends string>(
  configuration: CustomizerConfiguration,
  groupCode: keyof CustomizerConfiguration["selectedOptionCodes"],
  supportedCodes: readonly T[],
  fallbackCode: T,
): T {
  return (
    getSupportedOptionalSelection(configuration, groupCode, supportedCodes) ??
    fallbackCode
  );
}

function getSupportedOptionalSelection<T extends string>(
  configuration: CustomizerConfiguration,
  groupCode: keyof CustomizerConfiguration["selectedOptionCodes"],
  supportedCodes: readonly T[],
): T | null {
  return (
    configuration.selectedOptionCodes[groupCode]?.find((code): code is T =>
      (supportedCodes as readonly string[]).includes(code),
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

export type SuitBlock = "single" | "double" | "dinner";

export function getSuitBlock(selection: Suit3dSelection): SuitBlock {
  const codes = selection.selectedCodes;
  if (codes.lapel === "shawl-lapel") return "dinner";
  if (codes.jacket === "double-breasted-six-button") return "double";
  return "single";
}

const POCKET_MESH: Record<string, string> = {
  "patch-pockets": "patch",
  "jetted-pockets": "welt",
  "slanted-flap-pockets": "slanted",
};

export function isSuitMeshVisible(
  name: string,
  selection: Suit3dSelection,
): boolean {
  const codes = selection.selectedCodes;
  const block = getSuitBlock(selection);
  if (name.startsWith("vest_") || name === "waistcoat")
    return Boolean(codes.vest);
  if (name.startsWith("shirt_button_")) return block === "single";
  if (name.startsWith("waist_loop_") || name.startsWith("waist_adjuster_")) {
    const waist = selection.trouserDetails?.waist ?? codes.trousers;
    return name.startsWith("waist_loop_")
      ? waist === "belt-loops"
      : waist === "side-adjusters";
  }
  if (name.startsWith("pleat_")) {
    const pleats =
      selection.trouserDetails?.pleats ??
      (codes.trousers === "single-pleat-trousers" ? "single" : "flat");
    return pleats !== "flat" && (pleats === "double" || name.endsWith("_0"));
  }
  const prefix = /^(single|double|dinner)_/.exec(name)?.[1];
  if (!prefix) return true;
  if (prefix !== block) return false;
  if (name.includes("_lapel_"))
    return name.endsWith("_" + codes.lapel.replace("-lapel", ""));
  if (name.includes("_pocket_"))
    return name.endsWith("_" + (POCKET_MESH[codes.pockets] ?? "flap"));
  if (name === "single_button_11")
    return codes.jacket !== "single-breasted-one-button";
  const details = selection.jacketDetails;
  if (name.endsWith("_breast")) return details.breastPocket;
  if (name.endsWith("_buttonhole")) return details.lapelButtonhole;
  if (name.startsWith("double_button_upper_")) return !details.fourByTwo;
  const rank = SLEEVE_BUTTON_RANK[name];
  if (rank !== undefined && details.sleeveButtons !== null)
    return rank < details.sleeveButtons;
  return true;
}

const SLEEVE_BUTTON_RANK: Record<string, number> = Object.fromEntries(
  (
    [
      ["single", [1, 0, 2], [4, 3, 5]],
      ["double", [2, 1, 3], [5, 4, 6]],
      ["dinner", [0, 1, 2, 3], [4, 5, 6, 7]],
    ] as const
  ).flatMap(([block, right, left]) =>
    [right, left].flatMap((sleeve) =>
      sleeve.map((index, rank) => [`${block}_button_${index}`, rank]),
    ),
  ),
);
