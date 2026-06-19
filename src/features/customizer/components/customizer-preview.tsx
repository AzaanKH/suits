"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateConfigurationPrice } from "@/features/customizer/pricing";
import { createConfigurationSummary } from "@/features/customizer/serialization";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
} from "@/features/customizer/types";
import { formatCurrency, formatPriceModifier } from "@/lib/product-format";
import { TwoDimensionalPreview } from "./two-dimensional-preview";

const Suit3dPreview = dynamic(
  () =>
    import("@/features/customizer/three-d/suit-3d-preview").then(
      (mod) => mod.Suit3dPreview,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card flex aspect-[4/5] items-center justify-center rounded-lg border">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Box aria-hidden="true" className="size-4" />
          Loading 3D preview
        </div>
      </div>
    ),
  },
);

type CustomizerPreviewProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  threeDimensionalPreviewEnabled?: boolean;
};

type PreviewTab = "two-dimensional" | "three-dimensional" | "summary";

export function CustomizerPreview({
  catalog,
  configuration,
  threeDimensionalPreviewEnabled = false,
}: CustomizerPreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("two-dimensional");
  const price = calculateConfigurationPrice(catalog, configuration);
  const summary = createConfigurationSummary(catalog, configuration);

  return (
    <aside className="lg:sticky lg:top-24">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PreviewTab)}
        className="gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
              {catalog.product.name}
            </p>
            <p className="text-ink mt-1 text-2xl font-semibold">
              {formatCurrency(price.totalPriceCents)}
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="two-dimensional">2D</TabsTrigger>
            {threeDimensionalPreviewEnabled ? (
              <TabsTrigger value="three-dimensional">3D</TabsTrigger>
            ) : null}
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="two-dimensional">
          <TwoDimensionalPreview
            catalog={catalog}
            configuration={configuration}
            priority
          />
        </TabsContent>

        {threeDimensionalPreviewEnabled ? (
          <TabsContent value="three-dimensional">
            {activeTab === "three-dimensional" ? (
              <Suit3dPreview
                catalog={catalog}
                configuration={configuration}
                fallback={
                  <TwoDimensionalPreview
                    catalog={catalog}
                    configuration={configuration}
                  />
                }
              />
            ) : null}
          </TabsContent>
        ) : null}

        <TabsContent value="summary">
          <div className="bg-card rounded-lg border p-4">
            <div className="space-y-3">
              {summary.selections.map((selection) => (
                <div
                  className="flex items-start justify-between gap-4 text-sm"
                  key={`${selection.stepCode}-${selection.optionCode}`}
                >
                  <div>
                    <p className="text-muted-foreground text-xs font-bold tracking-[0.08em] uppercase">
                      {selection.groupLabel}
                    </p>
                    <p className="text-ink mt-1 font-medium">
                      {selection.optionLabel}
                    </p>
                  </div>
                  <p className="text-muted-foreground shrink-0">
                    {formatPriceModifier(selection.priceModifierCents)}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold">Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summary.totalPriceCents)}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
