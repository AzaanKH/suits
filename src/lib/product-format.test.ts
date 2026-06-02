import { describe, expect, it } from "vitest";

import { products } from "@/data/products";
import {
  formatBasePrice,
  formatCurrency,
  formatPriceModifier,
} from "@/lib/product-format";

describe("product formatting helpers", () => {
  it("formats whole-dollar USD prices", () => {
    expect(formatCurrency(1195)).toBe("$1,195");
  });

  it("labels a product base price as a starting price", () => {
    expect(formatBasePrice(products[0])).toBe("From $1,195");
  });

  it("formats included and additional customization costs", () => {
    expect(formatPriceModifier()).toBe("Included");
    expect(formatPriceModifier({ amount: 75, label: "Add $75" })).toBe("+$75");
  });

  it("formats a negative modifier as a deduction", () => {
    expect(formatPriceModifier({ amount: -50, label: "Save $50" })).toBe(
      "-$50",
    );
  });
});
