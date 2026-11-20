import { describe, expect, it } from "vitest";

import {
  customizationGroupSeeds,
  customizationOptionSeeds,
  fabricSeeds,
  productSeeds,
} from "../../../../convex/seedData";
import type { CustomizationOption, Product } from "@/types";

import { buildCustomizerCatalog } from "../compatibility";
import { getDefaultConfiguration } from "../defaults";
import {
  buildGalleryDesigns,
  GALLERY_RADIUS,
  getGalleryPlacement,
  HOUSE_PICKS,
} from "./suit-gallery-designs";
import { SUIT_3D_PRODUCT_SLUG } from "./suit-selection";

function houseSuitCatalog() {
  const seed = productSeeds.find((p) => p.slug === SUIT_3D_PRODUCT_SLUG)!;
  const product: Product = {
    id: "product_house",
    slug: seed.slug,
    name: seed.name,
    shortDescription: seed.shortDescription,
    fullDescription: seed.fullDescription,
    color: "Midnight Navy",
    images: [...seed.imageReferences],
    basePriceCents: seed.basePriceCents,
    featured: seed.featured,
    displayOrder: seed.displayOrder,
    category: null,
    availableFabrics: fabricSeeds
      .filter((f) => (seed.fabricCodes as readonly string[]).includes(f.code))
      .map((f) => ({ ...f, id: `fabric_${f.code}` })),
  } as Product;
  const options: CustomizationOption[] = customizationOptionSeeds
    .filter((o) =>
      (seed.customizationOptionCodes as readonly string[]).includes(o.code),
    )
    .map((o) => {
      const group = customizationGroupSeeds.find(
        (g) => g.code === o.groupCode,
      )!;
      return {
        id: `option_${o.code}`,
        code: o.code,
        label: o.label,
        description: o.description,
        priceModifierCents: o.priceModifierCents,
        displayOrder: o.displayOrder,
        compatibilityMetadata:
          "compatibilityMetadata" in o ? o.compatibilityMetadata : undefined,
        group: { ...group, id: `group_${group.code}` },
      };
    });
  return buildCustomizerCatalog(product, options);
}

describe("studio floor designs", () => {
  it("keeps every house pick intact on the House Suit", () => {
    const catalog = houseSuitCatalog();
    const designs = buildGalleryDesigns(
      catalog,
      getDefaultConfiguration(catalog),
      undefined,
      HOUSE_PICKS.length,
    );
    expect(designs).toHaveLength(HOUSE_PICKS.length);
    for (const pick of HOUSE_PICKS) {
      const design = designs.find((d) => d.id === pick.id)!;
      expect(design.configuration.fabricCode).toBe(pick.fabricCode);
      for (const [group, codes] of Object.entries(pick.selectedOptionCodes)) {
        expect(
          design.configuration.selectedOptionCodes[
            group as keyof typeof pick.selectedOptionCodes
          ],
          `${pick.id} ${group}`,
        ).toEqual(codes);
      }
    }
  });

  it("puts the visitor's saved designs for this suit first", () => {
    const catalog = houseSuitCatalog();
    const current = getDefaultConfiguration(catalog);
    const designs = buildGalleryDesigns(
      catalog,
      current,
      [
        {
          _id: "a",
          name: "My wedding suit",
          productSlug: SUIT_3D_PRODUCT_SLUG,
          updatedAt: Date.UTC(2026, 10, 12),
          configuration: { ...current, fabricCode: "grey-traveller" },
        },
        {
          _id: "b",
          name: "Another suit's design",
          productSlug: "travel-slate-grey-suit",
          updatedAt: Date.UTC(2026, 10, 10),
          configuration: current,
        },
      ],
      7,
    );
    expect(designs[0]).toMatchObject({
      id: "saved-a",
      source: "saved",
      name: "My wedding suit",
    });
    expect(designs[0].configuration.fabricCode).toBe("grey-traveller");
    expect(designs.some((d) => d.id === "saved-b")).toBe(false);
  });

  it("lines suits up behind the visitor's suit, facing it, clear of each other", () => {
    for (const count of [1, 4, 7]) {
      const placements = Array.from({ length: count }, (_, i) =>
        getGalleryPlacement(i, count),
      );
      for (const { position, rotationY } of placements) {
        expect(Math.hypot(position[0], position[2])).toBeCloseTo(
          GALLERY_RADIUS,
        );
        expect(position[2]).toBeLessThan(-GALLERY_RADIUS / 2 + 0.01);
        const front = [Math.sin(rotationY), Math.cos(rotationY)];
        const toCenter = [-position[0], -position[2]].map(
          (v) => v / GALLERY_RADIUS,
        );
        expect(front[0] * toCenter[0] + front[1] * toCenter[1]).toBeCloseTo(1);
      }
      for (let i = 1; i < count; i++) {
        const [a, b] = [placements[i - 1].position, placements[i].position];
        expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(1.32);
      }
    }
  });
});
