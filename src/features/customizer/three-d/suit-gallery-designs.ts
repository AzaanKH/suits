import { normalizeConfiguration } from "../defaults";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
  SelectedOptionCodes,
} from "../types";

/** A suit standing on the studio floor that the visitor can walk up to. */
export type GalleryDesign = {
  id: string;
  name: string;
  source: "house" | "saved";
  /** Shown under the name, e.g. "House pick" or "Saved 12 Nov". */
  sourceLabel: string;
  configuration: CustomizerConfiguration;
};

type HousePick = {
  id: string;
  name: string;
  fabricCode: string;
  selectedOptionCodes: Partial<SelectedOptionCodes>;
};

/**
 * Curated by the house. Every pick uses only cloths and options the House Suit
 * offers, so "Wear this design" reproduces it exactly.
 */
export const HOUSE_PICKS: HousePick[] = [
  {
    id: "house-double-breasted",
    name: "Navy double-breasted",
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      "jacket-style": ["double-breasted-six-button"],
      lapel: ["peak-lapel"],
      buttons: ["horn-buttons"],
      pockets: ["straight-flap-pockets"],
      trousers: ["side-adjusters"],
      extras: [],
    },
  },
  {
    id: "house-dinner-shawl",
    name: "Midnight dinner jacket",
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-one-button"],
      lapel: ["shawl-lapel"],
      buttons: ["covered-buttons"],
      pockets: ["jetted-pockets"],
      trousers: ["side-adjusters"],
      extras: [],
    },
  },
  {
    id: "house-grey-three-piece",
    name: "Grey three-piece",
    fabricCode: "grey-traveller",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-two-button"],
      lapel: ["peak-lapel"],
      buttons: ["smoked-pearl-buttons"],
      pockets: ["slanted-flap-pockets"],
      trousers: ["brace-buttons"],
      extras: ["matching-waistcoat"],
    },
  },
  {
    id: "house-weekend-grey",
    name: "Weekend grey",
    fabricCode: "grey-traveller",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-two-button"],
      lapel: ["notch-lapel"],
      buttons: ["horn-buttons"],
      pockets: ["patch-pockets"],
      trousers: ["single-pleat-trousers"],
      extras: ["working-cuffs"],
    },
  },
];

export type SavedDesignForGallery = {
  _id: string;
  name: string;
  productSlug: string;
  updatedAt: number;
  configuration: Omit<CustomizerConfiguration, "selectedOptionCodes"> & {
    selectedOptionCodes: Record<string, string[]>;
  };
};

const savedDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * House picks plus the visitor's most recent saved designs for this suit.
 * House picks take on the visitor's fit and personal details; saved designs
 * come back exactly as they were saved.
 */
export function buildGalleryDesigns(
  catalog: CustomizerCatalog,
  current: CustomizerConfiguration,
  saved: SavedDesignForGallery[] | undefined,
  limit: number,
): GalleryDesign[] {
  const yours: GalleryDesign[] = (saved ?? [])
    .filter((design) => design.productSlug === catalog.product.slug)
    .slice(0, 3)
    .map((design) => ({
      id: `saved-${design._id}`,
      name: design.name,
      source: "saved",
      sourceLabel: `Saved ${savedDate.format(design.updatedAt)}`,
      configuration: normalizeConfiguration(
        catalog,
        design.configuration as CustomizerConfiguration,
      ),
    }));
  const house: GalleryDesign[] = HOUSE_PICKS.map((pick) => ({
    id: pick.id,
    name: pick.name,
    source: "house",
    sourceLabel: "House pick",
    configuration: normalizeConfiguration(catalog, {
      ...current,
      fabricCode: pick.fabricCode,
      selectedOptionCodes: {
        ...current.selectedOptionCodes,
        ...pick.selectedOptionCodes,
      },
    }),
  }));
  return [...yours, ...house].slice(0, limit);
}

/** Distance from the visitor's suit to the lineup behind it, in meters. */
export const GALLERY_RADIUS = 4;
/** Angle between neighbors: about 1.4 m apart at this radius, clear of the podiums. */
const GALLERY_STEP = (20 / 180) * Math.PI;

/**
 * The other suits stand in an arc behind the visitor's own, facing it, so
 * from the front they line up just over its shoulders. The arc never spans
 * more than the back third of the room (120° to 240°).
 */
export function getGalleryPlacement(index: number, count: number) {
  const step =
    count > 1 ? Math.min(GALLERY_STEP, (Math.PI * 2) / 3 / (count - 1)) : 0;
  const angle = Math.PI + (index - (count - 1) / 2) * step;
  const x = Math.sin(angle) * GALLERY_RADIUS;
  const z = Math.cos(angle) * GALLERY_RADIUS;
  return {
    position: [x, 0, z] as [number, number, number],
    // Local +z is the suit's front; turn it toward the visitor's suit.
    rotationY: Math.atan2(-x, -z),
  };
}
