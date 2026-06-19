"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Ruler,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
  CartActionButton,
  type CartEditContext,
} from "@/components/cart/cart-action-button";
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
import {
  type CartFitSelection,
  type CartLineItem,
  createDefaultStandardFitSelection,
  getCartLineFitSelection,
  isCartLineItem,
  STANDARD_FIT_PREFERENCES,
  type StandardFitPreference,
  useCartStore,
} from "@/store/cart-store";
import { useCustomizerStore } from "@/store/customizer-store";

type SuitCustomizerProps = {
  productSlug: string;
  threeDimensionalPreviewEnabled?: boolean;
};

export function SuitCustomizer({
  productSlug,
  threeDimensionalPreviewEnabled = false,
}: SuitCustomizerProps) {
  const searchParams = useSearchParams();
  const designId = searchParams.get("designId");
  const cartLineId = searchParams.get("cartLineId");
  const cartSource =
    searchParams.get("cartSource") === "authenticated"
      ? "authenticated"
      : "guest";
  const { isAuthenticated } = useConvexAuth();
  const customizerData = useQuery(api.products.customizer, { productSlug });
  const savedDesign = useQuery(
    api.savedDesigns.get,
    designId && isAuthenticated
      ? { designId: designId as Id<"savedDesigns"> }
      : "skip",
  );
  const authenticatedCart = useQuery(
    api.carts.mine,
    cartLineId && cartSource === "authenticated" && isAuthenticated
      ? {}
      : "skip",
  );
  const measurementProfiles = useQuery(
    api.measurementProfiles.mine,
    isAuthenticated ? {} : "skip",
  );
  const localCartLine = useCartStore((state) =>
    cartLineId && cartSource === "guest"
      ? (state.items.find((item) => item.lineId === cartLineId) ?? null)
      : null,
  );
  const loadedDesignId = useRef<string | null>(null);
  const rejectedDesignId = useRef<string | null>(null);
  const loadedCartLineId = useRef<string | null>(null);
  const rejectedCartLineId = useRef<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [fitSelection, setFitSelection] = useState<CartFitSelection>(() =>
    createDefaultStandardFitSelection(),
  );
  const configuration = useCustomizerStore((state) => state.configuration);
  const currentStepCode = useCustomizerStore((state) => state.currentStepCode);
  const dirty = useCustomizerStore((state) => state.dirty);
  const initialize = useCustomizerStore((state) => state.initialize);
  const loadConfiguration = useCustomizerStore(
    (state) => state.loadConfiguration,
  );
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
    if (!catalog || !designId || savedDesign === undefined) {
      return;
    }

    if (
      savedDesign === null ||
      savedDesign.productSlug !== catalog.product.slug
    ) {
      if (rejectedDesignId.current !== designId) {
        toast.error("Saved design could not be loaded for this suit.");
        rejectedDesignId.current = designId;
      }
      return;
    }

    if (loadedDesignId.current === designId) {
      return;
    }

    loadConfiguration(catalog, {
      ...savedDesign.configuration,
      selectedOptionCodes: savedDesign.configuration
        .selectedOptionCodes as CustomizerConfiguration["selectedOptionCodes"],
    });
    setFitSelection(createDefaultStandardFitSelection());
    loadedDesignId.current = designId;
  }, [catalog, designId, loadConfiguration, savedDesign]);

  useEffect(() => {
    if (!catalog || !cartLineId || designId) {
      return;
    }

    if (cartSource === "authenticated" && authenticatedCart === undefined) {
      return;
    }

    const cartLine =
      cartSource === "authenticated"
        ? getAuthenticatedCartLine(authenticatedCart, cartLineId)
        : localCartLine;

    if (!cartLine || cartLine.productSlug !== catalog.product.slug) {
      if (rejectedCartLineId.current !== cartLineId) {
        toast.error("Cart item could not be loaded for this suit.");
        rejectedCartLineId.current = cartLineId;
      }
      return;
    }

    if (loadedCartLineId.current === cartLineId) {
      return;
    }

    loadConfiguration(catalog, {
      ...cartLine.configuration,
      selectedOptionCodes: cartLine.configuration
        .selectedOptionCodes as CustomizerConfiguration["selectedOptionCodes"],
    });
    const nextFitSelection = getSafeCartLineFitSelection(cartLine);

    queueMicrotask(() => setFitSelection(nextFitSelection));
    loadedCartLineId.current = cartLineId;
  }, [
    authenticatedCart,
    cartLineId,
    cartSource,
    catalog,
    designId,
    loadConfiguration,
    localCartLine,
  ]);

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
  const activeCartLine =
    cartSource === "authenticated"
      ? getAuthenticatedCartLine(authenticatedCart, cartLineId)
      : localCartLine;
  const cartEditContext: CartEditContext | null =
    cartLineId && activeCartLine?.productSlug === catalog.product.slug
      ? {
          lineId: cartLineId,
          source: cartSource,
          quantity: activeCartLine.quantity,
        }
      : null;

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
          <CustomizerPreview
            catalog={catalog}
            configuration={configuration}
            threeDimensionalPreviewEnabled={threeDimensionalPreviewEnabled}
          />
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
              cartEditContext={cartEditContext}
              fitSelection={fitSelection}
              onFitSelectionChange={setFitSelection}
              measurementProfiles={measurementProfiles ?? []}
              measurementProfilesLoading={
                isAuthenticated && measurementProfiles === undefined
              }
              isAuthenticated={isAuthenticated}
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

function getAuthenticatedCartLine(
  cart:
    | {
        lineItems: unknown[];
      }
    | null
    | undefined,
  cartLineId: string | null,
) {
  if (!cartLineId) {
    return null;
  }

  const line = cart?.lineItems.find((item) => {
    if (!isCartLineItem(item)) {
      return false;
    }

    return item.lineId === cartLineId;
  });

  return isCartLineItem(line) ? line : null;
}

function getSafeCartLineFitSelection(cartLine: CartLineItem): CartFitSelection {
  try {
    return getCartLineFitSelection(cartLine);
  } catch {
    return createDefaultStandardFitSelection();
  }
}

type StepContentProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  currentStepCode: (typeof CUSTOMIZER_STEPS)[number]["code"];
  cartEditContext: CartEditContext | null;
  fitSelection: CartFitSelection;
  onFitSelectionChange: (fitSelection: CartFitSelection) => void;
  measurementProfiles: Array<{ _id: Id<"measurementProfiles">; name: string }>;
  measurementProfilesLoading: boolean;
  isAuthenticated: boolean;
};

function StepContent({
  catalog,
  configuration,
  currentStepCode,
  cartEditContext,
  fitSelection,
  onFitSelectionChange,
  measurementProfiles,
  measurementProfilesLoading,
  isAuthenticated,
}: StepContentProps) {
  if (currentStepCode === "fabric") {
    return <FabricStep catalog={catalog} configuration={configuration} />;
  }

  if (currentStepCode === "review") {
    return (
      <ReviewStep
        catalog={catalog}
        configuration={configuration}
        fitSelection={fitSelection}
        cartEditContext={cartEditContext}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (currentStepCode === "fit") {
    return (
      <FitMethodStep
        fitSelection={fitSelection}
        onFitSelectionChange={onFitSelectionChange}
        measurementProfiles={measurementProfiles}
        measurementProfilesLoading={measurementProfilesLoading}
        isAuthenticated={isAuthenticated}
      />
    );
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
  fitSelection,
  cartEditContext,
  isAuthenticated,
}: {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  fitSelection: CartFitSelection;
  cartEditContext: CartEditContext | null;
  isAuthenticated: boolean;
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

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-serif text-3xl leading-none">
            Fit method
          </CardTitle>
          <CardDescription>{reviewFitSummary(fitSelection)}</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <SaveDesignButton configuration={configuration} summary={summary} />
        <CartActionButton
          configuration={configuration}
          fitSelection={fitSelection}
          editContext={cartEditContext}
          disabled={!isFitSelectionReady(fitSelection, isAuthenticated)}
        />
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

const jacketSizes = [
  "34S",
  "36S",
  "38S",
  "40S",
  "42S",
  "44S",
  "36R",
  "38R",
  "40R",
  "42R",
  "44R",
  "46R",
  "48R",
  "40L",
  "42L",
  "44L",
  "46L",
  "48L",
];
const trouserSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const trouserWaists = Array.from({ length: 16 }, (_, index) =>
  String(28 + index * 2),
);
const trouserInseams = ["28", "29", "30", "31", "32", "33", "34", "36"];

function FitMethodStep({
  fitSelection,
  onFitSelectionChange,
  measurementProfiles,
  measurementProfilesLoading,
  isAuthenticated,
}: {
  fitSelection: CartFitSelection;
  onFitSelectionChange: (fitSelection: CartFitSelection) => void;
  measurementProfiles: Array<{ _id: Id<"measurementProfiles">; name: string }>;
  measurementProfilesLoading: boolean;
  isAuthenticated: boolean;
}) {
  const ready = isFitSelectionReady(fitSelection, isAuthenticated);
  const standardSelection =
    fitSelection.fitMethod === "standard"
      ? fitSelection
      : createDefaultStandardFitSelection();
  const trouserSizingMode = standardSelection.trouserSize
    ? "trouser-size"
    : "waist-inseam";

  function selectStandard() {
    onFitSelectionChange(
      fitSelection.fitMethod === "standard"
        ? fitSelection
        : createDefaultStandardFitSelection(),
    );
  }

  function selectMadeToMeasure() {
    onFitSelectionChange(
      fitSelection.fitMethod === "made-to-measure"
        ? fitSelection
        : { fitMethod: "made-to-measure" },
    );
  }

  function updateStandard(updates: Partial<typeof standardSelection>) {
    onFitSelectionChange({
      ...standardSelection,
      ...updates,
      fitMethod: "standard",
    });
  }

  function chooseMeasurement(value: string) {
    if (value === "appointment") {
      onFitSelectionChange({
        fitMethod: "made-to-measure",
        measurementAppointmentRequired: true,
      });
      return;
    }

    const profile = measurementProfiles.find((item) => item._id === value);

    onFitSelectionChange({
      fitMethod: "made-to-measure",
      ...(profile
        ? {
            measurementProfileId: profile._id,
            measurementProfileName: profile.name,
          }
        : {}),
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FitChoiceCard
          title="Standard Fit"
          description="Choose ready sizing for the configured look without the friction of measurements."
          selected={fitSelection.fitMethod === "standard"}
          onSelect={selectStandard}
          icon="standard"
        />
        <FitChoiceCard
          title="Made to Measure"
          description="Use a measurement profile or request an appointment before tailor review."
          selected={fitSelection.fitMethod === "made-to-measure"}
          onSelect={selectMadeToMeasure}
          icon="mtm"
        />
      </div>

      {fitSelection.fitMethod === "standard" ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-serif text-3xl leading-none">
              Standard sizing
            </CardTitle>
            <CardDescription>
              Built to standard sizing. Final alterations may be needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="jacket-size"
                label="Jacket size"
                value={standardSelection.jacketSize}
                onChange={(value) => updateStandard({ jacketSize: value })}
                options={jacketSizes}
              />
              <div>
                <label
                  className="text-sm leading-none font-medium"
                  htmlFor="trouser-sizing-mode"
                >
                  Trouser sizing
                </label>
                <select
                  id="trouser-sizing-mode"
                  className="form-control mt-2 rounded-lg py-2"
                  value={trouserSizingMode}
                  onChange={(event) => {
                    if (event.target.value === "trouser-size") {
                      updateStandard({
                        trouserSize: "M",
                        trouserWaist: undefined,
                        trouserInseam: undefined,
                      });
                      return;
                    }

                    updateStandard({
                      trouserSize: undefined,
                      trouserWaist: "32",
                      trouserInseam: "32",
                    });
                  }}
                >
                  <option value="waist-inseam">Waist and inseam</option>
                  <option value="trouser-size">Trouser size</option>
                </select>
              </div>
              {trouserSizingMode === "trouser-size" ? (
                <SelectField
                  id="trouser-size"
                  label="Trouser size"
                  value={standardSelection.trouserSize ?? "M"}
                  onChange={(value) =>
                    updateStandard({
                      trouserSize: value,
                      trouserWaist: undefined,
                      trouserInseam: undefined,
                    })
                  }
                  options={trouserSizes}
                />
              ) : (
                <>
                  <SelectField
                    id="trouser-waist"
                    label="Trouser waist"
                    value={standardSelection.trouserWaist ?? "32"}
                    onChange={(value) =>
                      updateStandard({
                        trouserWaist: value,
                        trouserSize: undefined,
                      })
                    }
                    options={trouserWaists}
                  />
                  <SelectField
                    id="trouser-inseam"
                    label="Trouser inseam"
                    value={standardSelection.trouserInseam ?? "32"}
                    onChange={(value) =>
                      updateStandard({
                        trouserInseam: value,
                        trouserSize: undefined,
                      })
                    }
                    options={trouserInseams}
                  />
                </>
              )}
            </div>

            <div className="mt-5">
              <p className="text-sm leading-none font-medium">Fit preference</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STANDARD_FIT_PREFERENCES.map((preference) => (
                  <Button
                    type="button"
                    variant={
                      standardSelection.fitPreference === preference
                        ? "default"
                        : "outline"
                    }
                    key={preference}
                    onClick={() =>
                      updateStandard({
                        fitPreference: preference,
                      })
                    }
                  >
                    {formatFitPreference(preference)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-serif text-3xl leading-none">
              Made to Measure
            </CardTitle>
            <CardDescription>
              Made to your measurement profile. Tailor review happens before
              production.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="max-w-md">
                <label
                  className="text-sm leading-none font-medium"
                  htmlFor="measurement-profile"
                >
                  Measurement profile
                </label>
                <select
                  id="measurement-profile"
                  className="form-control mt-2 rounded-lg py-2"
                  value={measurementValue(fitSelection)}
                  disabled={measurementProfilesLoading}
                  onChange={(event) => chooseMeasurement(event.target.value)}
                >
                  <option value="">
                    {measurementProfilesLoading
                      ? "Loading profiles"
                      : "Select measurements"}
                  </option>
                  {measurementProfiles.map((profile) => (
                    <option value={profile._id} key={profile._id}>
                      {profile.name}
                    </option>
                  ))}
                  <option value="appointment">
                    Measurement appointment required
                  </option>
                </select>
                {measurementProfiles.length === 0 &&
                !measurementProfilesLoading ? (
                  <Link className="text-link mt-3" href="/account/measurements">
                    Create a profile
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <p className="text-ink text-sm font-semibold">
                  Sign in is required for Made to Measure.
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  Measurement profiles and appointment requests are tied to an
                  account before checkout.
                </p>
                <Link className="button-primary mt-4" href="/sign-in">
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="border-t pt-5">
        <p className="text-muted-foreground max-w-xl text-sm leading-6">
          {fitSelection.fitMethod === "standard"
            ? "Checkout is allowed with sizes only."
            : "Made to Measure orders require an account and a saved measurement profile or appointment request."}
        </p>
        {!ready ? (
          <p className="text-destructive mt-3 text-sm font-medium">
            Complete this fit choice before review.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FitChoiceCard({
  title,
  description,
  selected,
  onSelect,
  icon,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  icon: "standard" | "mtm";
}) {
  const Icon = icon === "standard" ? Ruler : CalendarClock;

  return (
    <button
      type="button"
      className={`rounded-lg border p-5 text-left transition ${
        selected
          ? "border-ink bg-stone"
          : "border-border bg-card hover:border-ink/40"
      }`}
      onClick={onSelect}
    >
      <span className="flex items-start justify-between gap-4">
        <Icon aria-hidden="true" className="text-ink mt-1 size-5" />
        {selected ? (
          <Check aria-hidden="true" className="text-ink size-5" />
        ) : null}
      </span>
      <span className="text-ink mt-4 block font-serif text-3xl leading-none">
        {title}
      </span>
      <span className="text-muted-foreground mt-3 block text-sm leading-6">
        {description}
      </span>
    </button>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm leading-none font-medium" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="form-control mt-2 rounded-lg py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function isFitSelectionReady(
  fitSelection: CartFitSelection,
  isAuthenticated: boolean,
) {
  if (fitSelection.fitMethod === "standard") {
    return Boolean(
      fitSelection.jacketSize &&
      fitSelection.fitPreference &&
      (fitSelection.trouserSize ||
        (fitSelection.trouserWaist && fitSelection.trouserInseam)),
    );
  }

  return Boolean(
    isAuthenticated &&
    (fitSelection.measurementProfileId ||
      fitSelection.measurementAppointmentRequired),
  );
}

function measurementValue(fitSelection: CartFitSelection) {
  if (fitSelection.fitMethod !== "made-to-measure") {
    return "";
  }

  if (fitSelection.measurementAppointmentRequired) {
    return "appointment";
  }

  return fitSelection.measurementProfileId ?? "";
}

function reviewFitSummary(fitSelection: CartFitSelection) {
  if (fitSelection.fitMethod === "made-to-measure") {
    if (fitSelection.measurementAppointmentRequired) {
      return "Made to Measure / Measurement appointment required.";
    }

    if (fitSelection.measurementProfileName) {
      return `Made to Measure / Measurement profile: ${fitSelection.measurementProfileName}.`;
    }

    return "Made to Measure / Measurement profile needed.";
  }

  const trouser = fitSelection.trouserSize
    ? `trouser ${fitSelection.trouserSize}`
    : `waist ${fitSelection.trouserWaist} / inseam ${fitSelection.trouserInseam}`;

  return `Standard Fit / Jacket ${fitSelection.jacketSize}, ${trouser}, ${fitSelection.fitPreference} fit. Built to standard sizing. Final alterations may be needed.`;
}

function formatFitPreference(preference: StandardFitPreference) {
  return preference.charAt(0).toUpperCase() + preference.slice(1);
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
