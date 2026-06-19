import { describe, expect, it } from "vitest";

import { getAddressFingerprint } from "@/lib/address-fingerprint";
import { getCheckoutBehavior } from "@/lib/usps-addresses";

describe("USPS address checkout behavior", () => {
  it.each([
    ["Y", "accept"],
    ["D", "add_unit"],
    ["S", "verify_unit"],
    ["N", "confirm"],
    [undefined, "confirm"],
  ] as const)("maps DPV %s to %s", (dpv, behavior) => {
    expect(getCheckoutBehavior(dpv)).toBe(behavior);
  });

  it("normalizes address fingerprints for comparisons", () => {
    expect(
      getAddressFingerprint({
        line1: "12531 NE 23rd Pl.",
        line2: "Apt C6",
        city: "Bellevue",
        state: "WA",
        postalCode: "98005-1571",
        country: "United States",
      }),
    ).toBe(
      getAddressFingerprint({
        line1: "12531 ne 23rd pl",
        line2: "APT C6",
        city: "BELLEVUE",
        state: "wa",
        postalCode: "98005-1571",
        country: "United States",
      }),
    );
  });
});
