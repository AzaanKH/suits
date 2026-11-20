"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  calculateConfigurationPrice,
  getSelectedFabric,
  getSelectedOptions,
} from "@/features/customizer/pricing";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
} from "@/features/customizer/types";
import { formatPriceModifier } from "@/lib/product-format";

type TwoDimensionalPreviewProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  priority?: boolean;
};

export function TwoDimensionalPreview({
  catalog,
  configuration,
  priority = false,
}: TwoDimensionalPreviewProps) {
  const selectedFabric = getSelectedFabric(catalog, configuration);
  const selectedOptions = getSelectedOptions(catalog, configuration);
  const image = selectedFabric?.imageReference ??
    catalog.product.images[0] ?? {
      src: "/images/hero-tailoring.png",
      alt: "Tailored suit preview",
    };
  const price = calculateConfigurationPrice(catalog, configuration);

  return (
    <>
      <div className="bg-stone relative aspect-[4/5] overflow-hidden rounded-lg">
        <Image
          priority={priority}
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
    </>
  );
}
