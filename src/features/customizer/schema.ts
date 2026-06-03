import { z } from "zod";

export const customizerPersonalizationSchema = z.object({
  monogramText: z
    .string()
    .max(3, "Use up to three initials.")
    .regex(/^[A-Za-z]*$/, "Use letters only."),
  notes: z.string().max(240, "Keep notes under 240 characters."),
});

export type CustomizerPersonalizationFormValues = z.input<
  typeof customizerPersonalizationSchema
>;
