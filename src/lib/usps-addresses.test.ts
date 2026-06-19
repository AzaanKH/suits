import { describe, expect, it } from "vitest";

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
});
