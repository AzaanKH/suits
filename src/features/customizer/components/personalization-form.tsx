"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tailoring notes</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="form-control min-h-28 resize-y rounded-lg"
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    onChange({ notes: event.target.value });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
