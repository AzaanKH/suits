import { z } from "zod";

export const measurementUnits = ["in", "cm"] as const;
export const jacketFits = ["slim", "classic", "relaxed"] as const;
export const trouserFits = ["tapered", "straight", "relaxed"] as const;
export const shoulderPreferences = ["natural", "structured", "soft"] as const;
export const trouserBreaks = ["none", "slight", "medium", "full"] as const;

export const measurementFields = [
  {
    name: "chest",
    label: "Chest",
    instruction: "Measure around the fullest part of the chest.",
  },
  {
    name: "waist",
    label: "Natural waist",
    instruction: "Measure around the narrowest point of the torso.",
  },
  {
    name: "hips",
    label: "Seat / hips",
    instruction: "Measure around the fullest part of the seat.",
  },
  {
    name: "shoulderWidth",
    label: "Shoulder width",
    instruction: "Measure straight across from shoulder point to shoulder point.",
  },
  {
    name: "sleeveLength",
    label: "Sleeve length",
    instruction: "Measure from shoulder point to wrist with the arm relaxed.",
  },
  {
    name: "jacketLength",
    label: "Jacket length",
    instruction: "Measure from the base of the collar to the desired hem.",
  },
  {
    name: "trouserWaist",
    label: "Trouser waist",
    instruction: "Measure where the trouser waistband should sit.",
  },
  {
    name: "inseam",
    label: "Inseam",
    instruction: "Measure from crotch seam to trouser hem.",
  },
  {
    name: "outseam",
    label: "Outseam",
    instruction: "Measure from waistband to trouser hem.",
  },
] as const;

const numericMeasurement = z
  .number({ error: "Enter a measurement." })
  .finite("Enter a measurement.")
  .positive("Enter a measurement greater than zero.");

export const measurementProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be 80 characters or fewer."),
    units: z.enum(measurementUnits),
    bodyMeasurements: z.object(
      Object.fromEntries(
        measurementFields.map((field) => [field.name, numericMeasurement]),
      ) as Record<(typeof measurementFields)[number]["name"], typeof numericMeasurement>,
    ),
    fitPreferences: z.object({
      jacketFit: z.enum(jacketFits),
      trouserFit: z.enum(trouserFits),
      shoulderPreference: z.enum(shoulderPreferences),
      trouserBreak: z.enum(trouserBreaks),
    }),
    notes: z.string().max(500, "Notes must be 500 characters or fewer."),
  })
  .superRefine((value, ctx) => {
    const maximum = value.units === "cm" ? 230 : 90;
    const minimum = value.units === "cm" ? 20 : 8;

    for (const field of measurementFields) {
      const measurement = value.bodyMeasurements[field.name];

      if (measurement < minimum || measurement > maximum) {
        ctx.addIssue({
          code: "custom",
          path: ["bodyMeasurements", field.name],
          message: `Enter a realistic ${field.label.toLowerCase()} measurement.`,
        });
      }
    }

    if (
      value.bodyMeasurements.inseam >= value.bodyMeasurements.outseam
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bodyMeasurements", "inseam"],
        message: "Inseam must be shorter than outseam.",
      });
    }
  });

export type MeasurementProfileFormValues = z.infer<
  typeof measurementProfileSchema
>;

export const defaultMeasurementProfileValues: MeasurementProfileFormValues = {
  name: "",
  units: "in",
  bodyMeasurements: {
    chest: 40,
    waist: 34,
    hips: 40,
    shoulderWidth: 18,
    sleeveLength: 25,
    jacketLength: 30,
    trouserWaist: 34,
    inseam: 31,
    outseam: 41,
  },
  fitPreferences: {
    jacketFit: "classic",
    trouserFit: "straight",
    shoulderPreference: "natural",
    trouserBreak: "slight",
  },
  notes: "",
};

export function inchesToUnit(valueInches: number, units: "in" | "cm") {
  const value = units === "cm" ? valueInches * 2.54 : valueInches;

  return Math.round(value * 10) / 10;
}
