export const CUSTOMIZER_GROUP_CODES = [
  "jacket-style",
  "lapel",
  "buttons",
  "pockets",
  "trousers",
  "extras",
] as const;

export type CustomizerGroupCode = (typeof CUSTOMIZER_GROUP_CODES)[number];

export const CUSTOMIZER_STEPS = [
  {
    code: "fabric",
    label: "Choose fabric",
    shortLabel: "Fabric",
    description: "Start with the cloth, color, and seasonality.",
  },
  {
    code: "jacket-style",
    label: "Choose jacket style",
    shortLabel: "Jacket",
    description: "Select the jacket silhouette and closure.",
    groupCode: "jacket-style",
  },
  {
    code: "lapel",
    label: "Choose lapel",
    shortLabel: "Lapel",
    description: "Set the lapel shape and level of formality.",
    groupCode: "lapel",
  },
  {
    code: "buttons",
    label: "Choose buttons",
    shortLabel: "Buttons",
    description: "Select the button material and finish.",
    groupCode: "buttons",
  },
  {
    code: "pockets",
    label: "Choose pockets",
    shortLabel: "Pockets",
    description: "Choose the jacket pocket treatment.",
    groupCode: "pockets",
  },
  {
    code: "trousers",
    label: "Choose trousers",
    shortLabel: "Trousers",
    description: "Choose the trouser waistband and front.",
    groupCode: "trousers",
  },
  {
    code: "extras",
    label: "Choose vest or optional extras",
    shortLabel: "Extras",
    description: "Add optional pieces and hand-finished details.",
    groupCode: "extras",
  },
  {
    code: "review",
    label: "Review configuration",
    shortLabel: "Review",
    description: "Confirm the selected details and total price.",
  },
] as const;

export type CustomizerStepCode = (typeof CUSTOMIZER_STEPS)[number]["code"];

export type CustomizerSelectionMode = "single" | "multiple";

export function isCustomizerGroupCode(
  value: unknown,
): value is CustomizerGroupCode {
  return (
    typeof value === "string" &&
    CUSTOMIZER_GROUP_CODES.includes(value as CustomizerGroupCode)
  );
}

export function isCustomizerStepCode(
  value: unknown,
): value is CustomizerStepCode {
  return (
    typeof value === "string" &&
    CUSTOMIZER_STEPS.some((step) => step.code === value)
  );
}

export function getGroupSelectionMode(
  groupCode: CustomizerGroupCode,
): CustomizerSelectionMode {
  return groupCode === "extras" ? "multiple" : "single";
}

export function getStepIndex(stepCode: CustomizerStepCode) {
  return CUSTOMIZER_STEPS.findIndex((step) => step.code === stepCode);
}

export function getStepByCode(stepCode: CustomizerStepCode) {
  return CUSTOMIZER_STEPS[getStepIndex(stepCode)];
}
