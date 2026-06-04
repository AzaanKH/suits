"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/storefront/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildCustomizerCatalog,
  getUnavailableReason,
} from "@/features/customizer/compatibility";
import {
  CUSTOMIZER_STEPS,
  getGroupSelectionMode,
  getStepIndex,
  type CustomizerGroupCode,
} from "@/features/customizer/steps";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerOptionGroup,
} from "@/features/customizer/types";
import { calculateConfigurationPrice } from "@/features/customizer/pricing";
import { createConfigurationSummary } from "@/features/customizer/serialization";
import { PageContainer } from "@/components/layout/page-container";
import { CustomizerPreview } from "./customizer-preview";
import { OptionCard } from "./option-card";
import { PersonalizationForm } from "./personalization-form";
import { SaveDesignButton } from "./save-design-button";
import { StepNavigation } from "./step-navigation";
import { formatCurrency, formatPriceModifier } from "@/lib/product-format";
import { useCustomizerStore } from "@/store/customizer-store";

type SuitCustomizerProps = {
  productSlug: string;
};

export function SuitCustomizer({ productSlug }: SuitCustomizerProps) {
  const customizerData = useQuery(api.products.customizer, { productSlug });
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const configuration = useCustomizerStore((state) => state.configuration);
  const currentStepCode = useCustomizerStore((state) => state.currentStepCode);
  const dirty = useCustomizerStore((state) => state.dirty);
  const initialize = useCustomizerStore((state) => state.initialize);
  const setStep = useCustomizerStore((state) => state.setStep);
  const goBack = useCustomizerStore((state) => state.goBack);
  const goNext = useCustomizerStore((state) => state.goNext);
  const reset = useCustomizerStore((state) => state.reset);

  const catalog = useMemo(() => {
    if (!customizerData?.product) {
      return null;
    }

    return buildCustomizerCatalog(
      customizerData.product,
      customizerData.options,
    );
  }, [customizerData]);

  useEffect(() => {
    if (catalog) {
      initialize(catalog);
    }
  }, [catalog, initialize]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentStepCode]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  if (customizerData === undefined) {
    return <CustomizerSkeleton />;
  }

  if (customizerData.product === null) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          title="Suit not found."
          description="This suit is unavailable or is no longer part of the active collection."
          headingTag="h1"
          action={{ label: "Return to the collection", href: "/shop" }}
        />
      </PageContainer>
    );
  }

  if (!catalog || !configuration) {
    return <CustomizerSkeleton />;
  }

  const currentStepIndex = getStepIndex(currentStepCode);
  const currentStep = CUSTOMIZER_STEPS[currentStepIndex] ?? CUSTOMIZER_STEPS[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === CUSTOMIZER_STEPS.length - 1;
  const price = calculateConfigurationPrice(catalog, configuration);

  return (
    <>
      <PageContainer className="py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                className="text-link text-muted-foreground hover:text-ink"
                href={`/shop/${catalog.product.slug}`}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back to suit
              </Link>
              <h1 className="text-ink mt-5 font-serif text-5xl leading-none tracking-[-0.03em] sm:text-6xl">
                Customize {catalog.product.name}
              </h1>
              <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7">
                {currentStep.description}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 sm:min-w-52">
              <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                Current total
              </p>
              <p className="text-ink mt-1 text-2xl font-semibold">
                {formatCurrency(price.totalPriceCents)}
              </p>
            </div>
          </div>

          <StepNavigation
            currentStepCode={currentStepCode}
            onStepChange={setStep}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10 xl:grid-cols-[0.82fr_1.18fr]">
          <CustomizerPreview catalog={catalog} configuration={configuration} />
          <section>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                  Step {currentStepIndex + 1} of {CUSTOMIZER_STEPS.length}
                </p>
                <h2 className="text-ink mt-2 font-serif text-4xl leading-none">
                  {currentStep.label}
                </h2>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDiscardDialogOpen(true)}
                disabled={!dirty}
              >
                <RotateCcw aria-hidden="true" />
                Reset
              </Button>
            </div>

            <StepContent
              catalog={catalog}
              configuration={configuration}
              currentStepCode={currentStep.code}
            />

            <div className="bg-background/95 sticky bottom-0 z-10 mt-8 border-t py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goBack}
                  disabled={isFirstStep}
                >
                  <ChevronLeft aria-hidden="true" />
                  Back
                </Button>
                <div className="text-muted-foreground hidden text-sm sm:block">
                  {formatCurrency(price.totalPriceCents)}
                </div>
                <Button size="lg" onClick={goNext} disabled={isLastStep}>
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </PageContainer>

      <Dialog
        open={discardDialogOpen}
        onOpenChange={(open) => setDiscardDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard selections?</DialogTitle>
            <DialogDescription>
              This will reset the current configuration to the default suit
              options.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscardDialogOpen(false)}
            >
              Keep selections
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset(catalog);
                setDiscardDialogOpen(false);
              }}
            >
              Discard selections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type StepContentProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  currentStepCode: (typeof CUSTOMIZER_STEPS)[number]["code"];
};

function StepContent({
  catalog,
  configuration,
  currentStepCode,
}: StepContentProps) {
  if (currentStepCode === "fabric") {
    return <FabricStep catalog={catalog} configuration={configuration} />;
  }

  if (currentStepCode === "review") {
    return <ReviewStep catalog={catalog} configuration={configuration} />;
  }

  const group = catalog.groupsByCode[currentStepCode as CustomizerGroupCode];

  if (!group) {
    return (
      <p className="text-muted-foreground rounded-lg border p-5 text-sm">
        This section is not available for the selected suit.
      </p>
    );
  }

  return (
    <OptionGroupStep
      group={group}
      configuration={configuration}
      catalog={catalog}
    />
  );
}

function FabricStep({
  catalog,
  configuration,
}: {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
}) {
  const selectFabric = useCustomizerStore((state) => state.selectFabric);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {catalog.fabricOptions.map((fabric) => (
        <OptionCard
          key={fabric.code}
          label={fabric.name}
          description={`${fabric.mill} / ${fabric.composition} / ${fabric.weight}. ${fabric.description}`}
          image={fabric.imageReference}
          eyebrow={fabric.seasonality}
          priceModifierCents={fabric.priceModifierCents}
          selected={configuration.fabricCode === fabric.code}
          onSelect={() => selectFabric(catalog, fabric.code)}
        />
      ))}
    </div>
  );
}

function OptionGroupStep({
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
              image={option.imageReference}
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

function ReviewStep({
  catalog,
  configuration,
}: {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
}) {
  const updatePersonalization = useCustomizerStore(
    (state) => state.updatePersonalization,
  );
  const summary = createConfigurationSummary(catalog, configuration);
  const price = calculateConfigurationPrice(catalog, configuration);
  const monogramEnabled = summary.selections.some(
    (selection) => selection.optionCode === "personal-monogram",
  );

  return (
    <div className="grid gap-5">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-serif text-3xl leading-none">
            Configuration
          </CardTitle>
          <CardDescription>
            {summary.productName} / {formatCurrency(price.totalPriceCents)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.selections.map((selection) => (
              <div
                className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-center"
                key={`${selection.stepCode}-${selection.optionCode}`}
              >
                <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                  {selection.groupLabel}
                </p>
                <p className="text-ink text-sm font-medium">
                  {selection.optionLabel}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatPriceModifier(selection.priceModifierCents)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
              Base and modifiers
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatCurrency(price.basePriceCents)} +{" "}
              {formatCurrency(price.modifierTotalCents)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
              Total
            </p>
            <p className="text-ink mt-1 text-2xl font-semibold">
              {formatCurrency(summary.totalPriceCents)}
            </p>
          </div>
        </CardFooter>
      </Card>

      <div className="flex justify-end">
        <SaveDesignButton configuration={configuration} summary={summary} />
      </div>

      <Separator />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-serif text-3xl leading-none">
            Tailoring notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalizationForm
            personalization={configuration.personalization}
            monogramEnabled={monogramEnabled}
            onChange={updatePersonalization}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CustomizerSkeleton() {
  return (
    <PageContainer className="py-8">
      <Skeleton className="h-4 w-28 rounded-none" />
      <Skeleton className="mt-6 h-16 w-full max-w-xl rounded-none" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="aspect-[4/5] rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-72 rounded-lg" key={index} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
