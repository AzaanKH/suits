"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import {
  customizerPersonalizationSchema,
  type CustomizerPersonalizationFormValues,
} from "@/features/customizer/schema";
import type { CustomizerPersonalization } from "@/features/customizer/types";

const fitPreferenceOptions = [
  {
    label: "No fit preference",
    value: "",
  },
  {
    label: "Balanced tailored fit",
    value:
      "Fit preference: Balanced tailored fit with room for normal movement.",
  },
  {
    label: "Closer through jacket and trousers",
    value: "Fit preference: Closer fit through jacket and trousers.",
  },
  {
    label: "Relaxed comfort fit",
    value: "Fit preference: Relaxed comfort fit with extra ease.",
  },
  {
    label: "Extra room in chest and shoulders",
    value: "Fit preference: Extra room through chest and shoulders.",
  },
  {
    label: "Extra room in seat and thigh",
    value: "Fit preference: Extra room through seat and thigh.",
  },
];

type PersonalizationFormProps = {
  personalization: CustomizerPersonalization;
  monogramEnabled: boolean;
  onChange: (personalization: Partial<CustomizerPersonalization>) => void;
};

export function PersonalizationForm({
  personalization,
  monogramEnabled,
  onChange,
}: PersonalizationFormProps) {
  const form = useForm<CustomizerPersonalizationFormValues>({
    resolver: zodResolver(customizerPersonalizationSchema),
    mode: "onChange",
    values: personalization,
  });

  return (
    <Form {...form}>
      <form className="grid gap-4">
        {monogramEnabled ? (
          <FormField
            control={form.control}
            name="monogramText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monogram initials</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={3}
                    value={field.value.toUpperCase()}
                    onChange={(event) => {
                      const monogramText = event.target.value.toUpperCase();

                      field.onChange(monogramText);
                      onChange({ monogramText });
                    }}
                  />
                </FormControl>
                <FormDescription>Up to three letters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => {
            return (
              <FormItem>
                <TailoringNotesFields
                  notes={field.value ?? ""}
                  onNotesChange={(updatedNotes) => {
                    field.onChange(updatedNotes);
                    onChange({ notes: updatedNotes });
                  }}
                />
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
}

function TailoringNotesFields({
  notes,
  onNotesChange,
}: {
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  const parsedNotes = parseTailoringNotes(notes);
  const [previousNotes, setPreviousNotes] = useState(notes);
  const [fitPreference, setFitPreference] = useState<string>(
    parsedNotes.fitPreference,
  );
  const [freeformNotes, setFreeformNotes] = useState<string>(
    parsedNotes.freeformNotes,
  );

  if (notes !== previousNotes) {
    setPreviousNotes(notes);
    setFitPreference(parsedNotes.fitPreference);
    setFreeformNotes(parsedNotes.freeformNotes);
  }

  const freeformMaxLength = getFreeformMaxLength(fitPreference);

  function handleFitPreferenceChange(nextFitPreference: string) {
    setFitPreference(nextFitPreference);
    onNotesChange(composeTailoringNotes(nextFitPreference, freeformNotes));
  }

  function handleFreeformNotesChange(nextFreeformNotes: string) {
    setFreeformNotes(nextFreeformNotes);
    onNotesChange(composeTailoringNotes(fitPreference, nextFreeformNotes));
  }

  return (
    <>
      <div className="grid gap-2">
        <FormLabel htmlFor="fit-preference">Fit preference</FormLabel>
        <select
          id="fit-preference"
          className="form-control rounded-lg py-2"
          value={fitPreference}
          onChange={(event) => handleFitPreferenceChange(event.target.value)}
        >
          {fitPreferenceOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FormDescription>
          The tailor uses this for the overall fit direction.
        </FormDescription>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <FormLabel>Tailoring notes</FormLabel>
          <span className="text-muted-foreground text-xs font-medium">
            {composeTailoringNotes(fitPreference, freeformNotes).length}/240
          </span>
        </div>
        <FormControl>
          <textarea
            value={freeformNotes}
            maxLength={freeformMaxLength}
            placeholder="Add specific requests, such as cleaner trouser break, sleeve length preference, or extra room in one area."
            className="form-control min-h-28 resize-y rounded-lg"
            onChange={(event) =>
              handleFreeformNotesChange(event.target.value)
            }
          />
        </FormControl>
      </div>
    </>
  );
}

function parseTailoringNotes(notes: string) {
  return {
    fitPreference: getFitPreference(notes),
    freeformNotes: getFreeformNotes(notes),
  };
}

function getFitPreference(notes: string): string {
  const fitLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("Fit preference:"));

  return fitLine &&
    fitPreferenceOptions.some((option) => option.value === fitLine)
    ? fitLine
    : "";
}

function getFreeformNotes(notes: string) {
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isKnownFitPreference(line))
    .join("\n");
}

function composeTailoringNotes(fitPreference: string, freeformNotes: string) {
  const lines = [fitPreference, freeformNotes.trim()].filter(Boolean);

  return lines.join("\n").slice(0, 240);
}

function getFreeformMaxLength(fitPreference: string) {
  if (!fitPreference) {
    return 240;
  }

  return Math.max(0, 240 - fitPreference.length - 1);
}

function isKnownFitPreference(line: string) {
  return fitPreferenceOptions.some((option) => option.value === line);
}
