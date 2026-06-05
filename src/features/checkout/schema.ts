import { z } from "zod";

import {
  getUsStateSalesTaxDetails,
  isUnitedStatesCountry,
} from "@/lib/sales-tax";

export const shippingAddressSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the recipient name.")
      .max(80, "Name must be 80 characters or fewer."),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a phone number.")
      .max(30, "Phone number must be 30 characters or fewer."),
    line1: z
      .string()
      .trim()
      .min(3, "Enter a street address.")
      .max(120, "Address line must be 120 characters or fewer."),
    line2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z
      .string()
      .trim()
      .min(2, "Enter a city.")
      .max(80, "City must be 80 characters or fewer."),
    state: z
      .string()
      .trim()
      .min(2, "Enter a state or region.")
      .max(80, "State or region must be 80 characters or fewer."),
    postalCode: z
      .string()
      .trim()
      .min(3, "Enter a postal code.")
      .max(20, "Postal code must be 20 characters or fewer."),
    country: z
      .string()
      .trim()
      .min(2, "Enter a country.")
      .max(80, "Country must be 80 characters or fewer."),
  })
  .superRefine((shippingAddress, ctx) => {
    if (
      shippingAddress.country.length >= 2 &&
      !isUnitedStatesCountry(shippingAddress.country)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Checkout currently supports United States addresses only.",
        path: ["country"],
      });
    }

    if (
      shippingAddress.state.length >= 2 &&
      !getUsStateSalesTaxDetails(shippingAddress.state)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid US state.",
        path: ["state"],
      });
    }
  });

export const checkoutPreparationSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;
export type CheckoutPreparationValues = z.infer<
  typeof checkoutPreparationSchema
>;

export const defaultShippingAddressValues: ShippingAddressValues = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
};
