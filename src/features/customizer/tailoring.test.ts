import { describe, expect, it } from "vitest";
import {
  TAILORING_FIELDS,
  TAILORING_DIMENSIONS,
  emptyTailoring,
  normalizeTailoring,
  tailoringValidationError,
  tailoringSignature,
  hasTailoringRequests,
} from "./tailoring";
import { getSuit3dSelection } from "./three-d/suit-selection";
import type { CustomizerConfiguration } from "./types";

const primary = {
  "jacket-style": ["single-breasted-two-button"],
  lapel: ["notch-lapel"],
  buttons: ["horn-buttons"],
  pockets: ["straight-flap-pockets"],
  trousers: ["side-adjusters"],
  extras: [],
};
const configuration: CustomizerConfiguration = {
  version: 1,
  productId: "example",
  productSlug: "house-navy-hopsack-suit",
  fabricCode: "navy-hopsack",
  selectedOptionCodes: primary,
  personalization: { notes: "", monogramText: "" },
};

describe("maker-neutral tailoring", () => {
  it("has unique field codes and options", () => {
    expect(
      new Set([...TAILORING_FIELDS, ...TAILORING_DIMENSIONS].map((f) => f.id))
        .size,
    ).toBe(TAILORING_FIELDS.length + TAILORING_DIMENSIONS.length);
    for (const f of TAILORING_FIELDS)
      expect(new Set(f.options.map((o) => o.value)).size).toBe(
        f.options.length,
      );
  });
  it("combines pleats, waist treatment, and brace buttons independently", () => {
    const tailoring = {
      ...emptyTailoring(),
      choices: {
        pleats: "double",
        "waist-treatment": "belt-loops",
        "brace-buttons": "inside",
      },
    };
    expect(tailoringValidationError(tailoring, primary)).toBeNull();
    const selection = getSuit3dSelection({ ...configuration, tailoring });
    expect(selection.trouserDetails).toEqual({
      waist: "belt-loops",
      pleats: "double",
    });
    expect(normalizeTailoring(tailoring, primary)).toEqual(tailoring);
  });
  it("rejects unknown fields, invalid dimensions, and missing prerequisites", () => {
    expect(
      tailoringValidationError(
        { ...emptyTailoring(), choices: { fake: "anything" } },
        primary,
      ),
    ).toMatch(/Unknown/);
    expect(
      tailoringValidationError(
        { ...emptyTailoring(), choices: { canvas: "magic" } },
        primary,
      ),
    ).toMatch(/Unknown/);
    for (const value of [NaN, Infinity, -1, 0, 400])
      expect(
        tailoringValidationError(
          { ...emptyTailoring(), dimensions: { "inseam-cm": value } },
          primary,
        ),
      ).toMatch(/Invalid/);
    expect(
      tailoringValidationError(
        { ...emptyTailoring(), choices: { "pleat-direction": "forward" } },
        primary,
      ),
    ).toMatch(/pleats/);
    expect(
      tailoringValidationError(
        { ...emptyTailoring(), dimensions: { "turn-up-cm": 4 } },
        primary,
      ),
    ).toMatch(/turn-ups/);
  });
  it("removes dependent requests when a parent option changes", () => {
    const spec = {
      ...emptyTailoring(),
      choices: {
        "waistcoat-presence": "no",
        "waistcoat-back": "self",
        pleats: "flat",
        "pleat-direction": "forward",
        hem: "plain",
      },
      dimensions: { "turn-up-cm": 4 },
    };
    expect(normalizeTailoring(spec, primary)).toEqual({
      version: 1,
      choices: { "waistcoat-presence": "no", pleats: "flat", hem: "plain" },
      dimensions: {},
    });
  });
  it("can request a waistcoat with a double-breasted reference jacket", () => {
    const tailoring = {
      ...emptyTailoring(),
      choices: { "waistcoat-presence": "yes", "waistcoat-back": "self" },
    };
    const selectedOptionCodes = {
      ...primary,
      "jacket-style": ["double-breasted-six-button"],
    };
    expect(tailoringValidationError(tailoring, selectedOptionCodes)).toBeNull();
    expect(
      getSuit3dSelection({
        ...configuration,
        selectedOptionCodes,
        tailoring,
      }).selectedCodes.vest,
    ).toBe("matching-waistcoat");
  });
  it("keeps per-garment fabric requests independent", () => {
    const result = getSuit3dSelection({
      ...configuration,
      tailoring: {
        ...emptyTailoring(),
        choices: {
          "trouser-cloth": "olive-flannel",
          "lapel-facing": "black-satin",
          "lining-color": "burgundy",
        },
      },
    });
    expect(result.fabricMaterial.code).toBe("navy-hopsack");
    expect(result.trouserMaterial.code).toBe("olive-flannel");
    expect(result.lapelMaterial.code).toBe("black-satin");
    expect(result.liningMaterial.color).toBe("#602d3e");
  });
  it("produces stable signatures without changing legacy configurations", () => {
    expect(tailoringSignature(undefined)).toBe("");
    expect(hasTailoringRequests(emptyTailoring())).toBe(false);
    const a = {
      ...emptyTailoring(),
      choices: { canvas: "full", vents: "side" },
    };
    const b = {
      ...emptyTailoring(),
      choices: { vents: "side", canvas: "full" },
    };
    expect(tailoringSignature(a)).toBe(tailoringSignature(b));
    expect(tailoringSignature(a)).not.toBe(
      tailoringSignature({ ...a, choices: { canvas: "half", vents: "side" } }),
    );
  });
});
