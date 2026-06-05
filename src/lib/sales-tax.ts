export type UsStateSalesTaxDetails = {
  code: string;
  name: string;
  rateBps: number;
};

export type UsStateSalesTaxQuote = UsStateSalesTaxDetails & {
  taxCents: number;
  totalCents: number;
};

const usStateSalesTaxRates: Record<string, UsStateSalesTaxDetails> = {
  AL: { code: "AL", name: "Alabama", rateBps: 400 },
  AK: { code: "AK", name: "Alaska", rateBps: 0 },
  AZ: { code: "AZ", name: "Arizona", rateBps: 560 },
  AR: { code: "AR", name: "Arkansas", rateBps: 650 },
  CA: { code: "CA", name: "California", rateBps: 725 },
  CO: { code: "CO", name: "Colorado", rateBps: 290 },
  CT: { code: "CT", name: "Connecticut", rateBps: 635 },
  DC: { code: "DC", name: "District of Columbia", rateBps: 600 },
  DE: { code: "DE", name: "Delaware", rateBps: 0 },
  FL: { code: "FL", name: "Florida", rateBps: 600 },
  GA: { code: "GA", name: "Georgia", rateBps: 400 },
  HI: { code: "HI", name: "Hawaii", rateBps: 400 },
  IA: { code: "IA", name: "Iowa", rateBps: 600 },
  ID: { code: "ID", name: "Idaho", rateBps: 600 },
  IL: { code: "IL", name: "Illinois", rateBps: 625 },
  IN: { code: "IN", name: "Indiana", rateBps: 700 },
  KS: { code: "KS", name: "Kansas", rateBps: 650 },
  KY: { code: "KY", name: "Kentucky", rateBps: 600 },
  LA: { code: "LA", name: "Louisiana", rateBps: 500 },
  MA: { code: "MA", name: "Massachusetts", rateBps: 625 },
  MD: { code: "MD", name: "Maryland", rateBps: 600 },
  ME: { code: "ME", name: "Maine", rateBps: 550 },
  MI: { code: "MI", name: "Michigan", rateBps: 600 },
  MN: { code: "MN", name: "Minnesota", rateBps: 687.5 },
  MO: { code: "MO", name: "Missouri", rateBps: 422.5 },
  MS: { code: "MS", name: "Mississippi", rateBps: 700 },
  MT: { code: "MT", name: "Montana", rateBps: 0 },
  NC: { code: "NC", name: "North Carolina", rateBps: 475 },
  ND: { code: "ND", name: "North Dakota", rateBps: 500 },
  NE: { code: "NE", name: "Nebraska", rateBps: 550 },
  NH: { code: "NH", name: "New Hampshire", rateBps: 0 },
  NJ: { code: "NJ", name: "New Jersey", rateBps: 662.5 },
  NM: { code: "NM", name: "New Mexico", rateBps: 487.5 },
  NV: { code: "NV", name: "Nevada", rateBps: 685 },
  NY: { code: "NY", name: "New York", rateBps: 400 },
  OH: { code: "OH", name: "Ohio", rateBps: 575 },
  OK: { code: "OK", name: "Oklahoma", rateBps: 450 },
  OR: { code: "OR", name: "Oregon", rateBps: 0 },
  PA: { code: "PA", name: "Pennsylvania", rateBps: 600 },
  RI: { code: "RI", name: "Rhode Island", rateBps: 700 },
  SC: { code: "SC", name: "South Carolina", rateBps: 600 },
  SD: { code: "SD", name: "South Dakota", rateBps: 420 },
  TN: { code: "TN", name: "Tennessee", rateBps: 700 },
  TX: { code: "TX", name: "Texas", rateBps: 625 },
  UT: { code: "UT", name: "Utah", rateBps: 485 },
  VA: { code: "VA", name: "Virginia", rateBps: 430 },
  VT: { code: "VT", name: "Vermont", rateBps: 600 },
  WA: { code: "WA", name: "Washington", rateBps: 650 },
  WI: { code: "WI", name: "Wisconsin", rateBps: 500 },
  WV: { code: "WV", name: "West Virginia", rateBps: 600 },
  WY: { code: "WY", name: "Wyoming", rateBps: 400 },
};

const stateNameToCode = new Map(
  Object.values(usStateSalesTaxRates).map((state) => [
    normalizeLookupValue(state.name),
    state.code,
  ]),
);

stateNameToCode.set("washington dc", "DC");
stateNameToCode.set("district of columbia", "DC");

export function getUsStateSalesTaxDetails(
  state: string,
): UsStateSalesTaxDetails | null {
  const normalizedState = normalizeLookupValue(state);

  if (!normalizedState) {
    return null;
  }

  const code =
    normalizedState.length === 2
      ? normalizedState.toUpperCase()
      : stateNameToCode.get(normalizedState);

  return code ? (usStateSalesTaxRates[code] ?? null) : null;
}

export function isUnitedStatesCountry(country: string) {
  return [
    "us",
    "usa",
    "u s a",
    "united states",
    "united states of america",
  ].includes(normalizeLookupValue(country));
}

export function calculateUsStateSalesTax({
  subtotalCents,
  state,
  country,
}: {
  subtotalCents: number;
  state: string;
  country: string;
}): UsStateSalesTaxQuote {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("Subtotal must be a non-negative whole-cent amount.");
  }

  if (!isUnitedStatesCountry(country)) {
    throw new Error(
      "Checkout currently supports United States addresses only.",
    );
  }

  const details = getUsStateSalesTaxDetails(state);

  if (!details) {
    throw new Error("Enter a valid US state.");
  }

  const taxCents = Math.round((subtotalCents * details.rateBps) / 10_000);

  return {
    ...details,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}

export function formatSalesTaxRate(rateBps: number) {
  return `${(rateBps / 100).toLocaleString("en-US", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  })}%`;
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}
