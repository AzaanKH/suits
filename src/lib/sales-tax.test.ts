import { describe, expect, it } from "vitest";

import { getUsStateSalesTaxDetails } from "@/lib/sales-tax";

describe("sales tax helpers", () => {
  it("normalizes punctuation in state names", () => {
    expect(getUsStateSalesTaxDetails("Washington, DC")?.code).toBe("DC");
  });
});
