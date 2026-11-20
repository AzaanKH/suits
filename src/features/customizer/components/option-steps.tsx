"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUnavailableReason } from "@/features/customizer/compatibility";
import { getGroupSelectionMode } from "@/features/customizer/steps";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerOptionGroup,
} from "@/features/customizer/types";
import { useCustomizerStore } from "@/store/customizer-store";

import { FABRIC_MATERIALS } from "../three-d/suit-selection";
import { OptionCard } from "./option-card";
import { PersonalizationForm } from "./personalization-form";

export function FabricStep({
  catalog,
  configuration,
}: {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
}) {
  const selectFabric = useCustomizerStore((state) => state.selectFabric);

  return (
    <div className="studio-fabric-grid">
      {catalog.fabricOptions.map((fabric) => (
        <OptionCard
          key={fabric.code}
          label={fabric.name}
          description={`${fabric.mill} / ${fabric.composition} / ${fabric.weight}. ${fabric.description}`}
          image={fabric.imageReference}
          swatchColor={
            FABRIC_MATERIALS[fabric.code as keyof typeof FABRIC_MATERIALS]
              ?.color
          }
          meta={fabric.seasonality}
          priceModifierCents={fabric.priceModifierCents}
          selected={configuration.fabricCode === fabric.code}
          onSelect={() => selectFabric(catalog, fabric.code)}
        />
      ))}
    </div>
  );
}

export function OptionGroupStep({
  catalog,
  configuration,
  group,
}: {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  group: CustomizerOptionGroup;
}) {
  const selectOption = useCustomizerStore((state) => state.selectOption);
  const toggleOption = useCustomizerStore((state) => state.toggleOption);
  const updatePersonalization = useCustomizerStore(
    (state) => state.updatePersonalization,
  );
  const selectedCodes = configuration.selectedOptionCodes[group.code] ?? [];
  const multiple = getGroupSelectionMode(group.code) === "multiple";
  const monogramEnabled =
    group.code === "extras" && selectedCodes.includes("personal-monogram");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {group.options.map((option) => {
          const disabledReason = getUnavailableReason(option, configuration);
          const selected = selectedCodes.includes(option.code);

          return (
            <OptionCard
              key={option.code}
              label={option.label}
              description={option.description}
              priceModifierCents={option.priceModifierCents}
              selected={selected}
              disabled={Boolean(disabledReason)}
              disabledReason={disabledReason}
              onSelect={() => {
                if (multiple) {
                  toggleOption(catalog, group.code, option.code);
                } else {
                  selectOption(catalog, group.code, option.code);
                }
              }}
            />
          );
        })}
      </div>
      {group.code === "extras" ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-serif text-3xl leading-none">
              Personal details
            </CardTitle>
            <CardDescription>
              Add initials or notes for the tailoring team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonalizationForm
              personalization={configuration.personalization}
              monogramEnabled={monogramEnabled}
              onChange={updatePersonalization}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
