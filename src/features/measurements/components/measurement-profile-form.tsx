"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultMeasurementProfileValues,
  jacketFits,
  measurementFields,
  measurementProfileSchema,
  shoulderPreferences,
  trouserBreaks,
  trouserFits,
  type MeasurementProfileFormValues,
} from "@/features/measurements/schema";

type MeasurementProfileFormProps = {
  defaultValues?: MeasurementProfileFormValues;
  submitLabel?: string;
  onSubmit: (values: MeasurementProfileFormValues) => Promise<void> | void;
};

export function MeasurementProfileForm({
  defaultValues = defaultMeasurementProfileValues,
  submitLabel = "Save profile",
  onSubmit,
}: MeasurementProfileFormProps) {
  const form = useForm<MeasurementProfileFormValues>({
    resolver: zodResolver(measurementProfileSchema),
    defaultValues,
    mode: "onBlur",
  });
  const units = useWatch({ control: form.control, name: "units" });
  const previousUnitsRef = useRef<MeasurementProfileFormValues["units"]>(
    defaultValues.units,
  );
  const skipNextUnitConversionRef = useRef(false);

  useEffect(() => {
    form.reset(defaultValues);
    previousUnitsRef.current = defaultValues.units;
    skipNextUnitConversionRef.current = true;
  }, [defaultValues, form]);

  useEffect(() => {
    const previousUnits = previousUnitsRef.current;

    if (skipNextUnitConversionRef.current) {
      skipNextUnitConversionRef.current = false;
      return;
    }

    if (!units || units === previousUnits) {
      return;
    }

    const currentValues = form.getValues();

    form.reset({
      ...currentValues,
      units,
      bodyMeasurements: mapMeasurements(
        currentValues.bodyMeasurements,
        previousUnits,
        units,
      ),
    });
    previousUnitsRef.current = units;
  }, [form, units]);

  async function handleSubmit(values: MeasurementProfileFormValues) {
    await onSubmit(values);
  }

  return (
    <Form {...form}>
      <form
        className="grid gap-7"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile name</FormLabel>
                <FormControl>
                  <Input placeholder="Navy wedding suit" {...field} />
                </FormControl>
                <FormDescription>
                  Use a clear name for the wearer or occasion.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Units</FormLabel>
                <FormControl>
                  <select className="form-control rounded-lg py-1.5" {...field}>
                    <option value="in">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                </FormControl>
                <FormDescription>
                  Stored consistently after saving.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <section>
          <h2 className="text-ink font-serif text-3xl leading-none">
            Body measurements
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Measure over a shirt while standing naturally. Keep the tape level
            and close to the body without pulling tight.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {measurementFields.map((measurement) => (
              <FormField
                key={measurement.name}
                control={form.control}
                name={`bodyMeasurements.${measurement.name}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{measurement.label}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.valueAsNumber)
                          }
                          className="pr-11"
                        />
                      </FormControl>
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold uppercase">
                        {units}
                      </span>
                    </div>
                    <FormDescription>{measurement.instruction}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-ink font-serif text-3xl leading-none">
            Fit preferences
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              control={form.control}
              name="fitPreferences.jacketFit"
              label="Jacket fit"
              options={jacketFits}
            />
            <SelectField
              control={form.control}
              name="fitPreferences.trouserFit"
              label="Trouser fit"
              options={trouserFits}
            />
            <SelectField
              control={form.control}
              name="fitPreferences.shoulderPreference"
              label="Shoulder"
              options={shoulderPreferences}
            />
            <SelectField
              control={form.control}
              name="fitPreferences.trouserBreak"
              label="Trouser break"
              options={trouserBreaks}
            />
          </div>
        </section>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Posture notes, recent changes, or fitting concerns."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes for the tailoring team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save aria-hidden="true" />
            {form.formState.isSubmitting ? "Saving" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SelectField({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useForm<MeasurementProfileFormValues>>["control"];
  name:
    | "fitPreferences.jacketFit"
    | "fitPreferences.trouserFit"
    | "fitPreferences.shoulderPreference"
    | "fitPreferences.trouserBreak";
  label: string;
  options: readonly string[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <select className="form-control rounded-lg py-1.5" {...field}>
              {options.map((option) => (
                <option value={option} key={option}>
                  {formatOption(option)}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function formatOption(value: string) {
  return value.replaceAll("-", " ").replace(/^\w/, (letter) =>
    letter.toUpperCase(),
  );
}

function mapMeasurements(
  measurements: MeasurementProfileFormValues["bodyMeasurements"],
  fromUnit: MeasurementProfileFormValues["units"],
  toUnit: MeasurementProfileFormValues["units"],
) {
  return Object.fromEntries(
    measurementFields.map((field) => [
      field.name,
      convertMeasurement(measurements[field.name], fromUnit, toUnit),
    ]),
  ) as MeasurementProfileFormValues["bodyMeasurements"];
}

function convertMeasurement(
  value: number,
  fromUnit: MeasurementProfileFormValues["units"],
  toUnit: MeasurementProfileFormValues["units"],
) {
  if (!Number.isFinite(value) || fromUnit === toUnit) {
    return value;
  }

  const inches = fromUnit === "cm" ? value / 2.54 : value;
  const converted = toUnit === "cm" ? inches * 2.54 : inches;

  return Math.round(converted * 10) / 10;
}
