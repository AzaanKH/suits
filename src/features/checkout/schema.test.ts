import { describe, expect, it } from "vitest";

import { shippingAddressSchema } from "@/features/checkout/schema";

const validShippingAddress = {
  fullName: "Test Customer",
  email: "test@example.com",
  phone: "5551234567",
  line1: "123 Test Street",
  city: "Toronto",
  state: "Ontario",
  postalCode: "M5V 2T6",
  country: "Canada",
};

describe("checkout schema", () => {
  it("does not add a US state error for non-US addresses", () => {
    const result = shippingAddressSchema.safeParse(validShippingAddress);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual([
        "country",
      ]);
    }
  });
});
