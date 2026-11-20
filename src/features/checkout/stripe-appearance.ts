import type { Appearance, CssFontSource } from "@stripe/stripe-js";

const PALETTE = {
  light: {
    theme: "stripe",
    colorPrimary: "#16191e",
    colorBackground: "#fafaf7",
    colorText: "#16191e",
    colorTextSecondary: "#5a5f66",
    colorDanger: "#a3341f",
    focusRing: "#2c4a8f",
  },
  dark: {
    theme: "night",
    colorPrimary: "#e8e9e3",
    colorBackground: "#1b1f24",
    colorText: "#e8e9e3",
    colorTextSecondary: "#9da3ab",
    colorDanger: "#e88a74",
    focusRing: "#a9bdf0",
  },
} as const;

export function getStripeAppearance(scheme: "light" | "dark"): Appearance {
  const { theme, focusRing, ...colors } = PALETTE[scheme];
  return {
    theme,
    variables: {
      ...colors,
      borderRadius: "4px",
      fontFamily: '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif',
      focusBoxShadow: `0 0 0 2px ${focusRing}`,
    },
  };
}

export const STRIPE_FONTS: CssFontSource[] = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=swap",
  },
];
