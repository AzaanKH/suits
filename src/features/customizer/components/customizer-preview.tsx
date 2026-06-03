"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateConfigurationPrice,
  getSelectedFabric,
  getSelectedOptions,
} from "@/features/customizer/pricing";
import { createConfigurationSummary } from "@/features/customizer/serialization";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
} from "@/features/customizer/types";
import { formatCurrency, formatPriceModifier } from "@/lib/product-format";

type CustomizerPreviewProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
};

export function CustomizerPreview({
  catalog,
  configuration,
}: CustomizerPreviewProps) {
  const selectedFabric = getSelectedFabric(catalog, configuration);
  const selectedOptions = getSelectedOptions(catalog, configuration);
  const image = selectedFabric?.imageReference ??
    catalog.product.images[0] ?? {
      src: "/images/hero-tailoring.png",
      alt: "Tailored suit preview",
    };
  const price = calculateConfigurationPrice(catalog, configuration);
  const summary = createConfigurationSummary(catalog, configuration);

  return (
    <aside className="lg:sticky lg:top-24">
      <Tabs defaultValue="preview" className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
              {catalog.product.name}
            </p>
            <p className="text-ink mt-1 text-2xl font-semibold">
              {formatCurrency(price.totalPriceCents)}
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preview">
          <div className="bg-stone relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              priority
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              src={image.src}
              alt={image.alt}
              className="object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {selectedFabric ? (
                <Badge variant="secondary">{selectedFabric.color}</Badge>
              ) : null}
              {price.modifierTotalCents > 0 ? (
                <Badge>{formatPriceModifier(price.modifierTotalCents)}</Badge>
              ) : null}
            </div>
          </div>
          {selectedOptions.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {selectedOptions.slice(0, 4).map((option) =>
                option.imageReference ? (
                  <div
                    className="bg-stone relative aspect-square overflow-hidden rounded-md"
                    key={option.code}
                  >
                    <Image
                      fill
                      sizes="96px"
                      src={option.imageReference.src}
                      alt={option.imageReference.alt}
                      className="object-cover"
                    />
                  </div>
                ) : null,
              )}
            </div>
          ) : null}
        </TabsContent>

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
