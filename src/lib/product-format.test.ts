import { describe, expect, it } from "vitest";

import {
  formatBasePrice,
  formatCurrency,
  formatPriceModifier,
} from "@/lib/product-format";
import { productFixtures } from "@/test/fixtures";

describe("product formatting helpers", () => {
  it("formats whole-dollar USD prices", () => {
    expect(formatCurrency(119500)).toBe("$1,195.00");
  });

  it("labels a product base price as a starting price", () => {
    expect(formatBasePrice(productFixtures[0])).toBe("From $1,195.00");
  });

  it("formats included and additional customization costs", () => {
    expect(formatPriceModifier(0)).toBe("Included");
    expect(formatPriceModifier(7500)).toBe("+$75.00");
  });

  it("formats a negative modifier as a deduction", () => {
    expect(formatPriceModifier(-5000)).toBe("-$50.00");
  });
});
