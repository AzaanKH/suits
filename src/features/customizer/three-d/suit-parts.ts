import type { CustomizerStepCode } from "../steps";

export const STUDIO_STEP_CODES = [
  "fabric",
  "jacket-style",
  "lapel",
  "buttons",
  "pockets",
  "trousers",
  "extras",
] as const satisfies readonly CustomizerStepCode[];

export type StudioStepCode = (typeof STUDIO_STEP_CODES)[number];

export type SuitPart = {
  step: Exclude<StudioStepCode, "fabric">;
  label: string;
};

const PARTS: Record<SuitPart["step"], SuitPart> = {
  "jacket-style": { step: "jacket-style", label: "Jacket" },
  lapel: { step: "lapel", label: "Lapel" },
  buttons: { step: "buttons", label: "Buttons" },
  pockets: { step: "pockets", label: "Pockets" },
  trousers: { step: "trousers", label: "Trousers" },
  extras: { step: "extras", label: "Waistcoat" },
};

export function getSuitPartForMesh(name: string): SuitPart | null {
  if (name.startsWith("shirt_") || /^(single|double|dinner)_shirt/.test(name))
    return null;
  if (name === "waistcoat" || name.startsWith("vest_")) return PARTS.extras;
  if (
    name === "trousers" ||
    name.startsWith("pleat_") ||
    name.startsWith("waist_")
  )
    return PARTS.trousers;

  const part = name.match(/^(?:single|double|dinner)_([a-z]+)/)?.[1];
  switch (part) {
    case "lapel":
    case "collar":
      return PARTS.lapel;
    case "pocket":
    case "breast":
    case "ticket":
    case "inpocket":
      return PARTS.pockets;
    case "button":
    case "buttonhole":
      return PARTS.buttons;
    case "body":
    case "cuff":
      return PARTS["jacket-style"];
    default:
      return null;
  }
}

export function isStudioStepCode(code: string): code is StudioStepCode {
  return (STUDIO_STEP_CODES as readonly string[]).includes(code);
}
