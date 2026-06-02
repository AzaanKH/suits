import type { Category, CustomizationOption, Fabric, Product } from "@/types";

export const categories: Category[] = [
  {
    id: "business",
    name: "Business",
    description: "Versatile tailoring for a working wardrobe.",
  },
  {
    id: "occasion",
    name: "Occasion",
    description: "Refined silhouettes for evenings and significant moments.",
  },
  {
    id: "seasonal",
    name: "Seasonal",
    description: "Textural cloths and softer expressions of the house cut.",
  },
];

const fabrics: Record<string, Fabric> = {
  navyHopsack: {
    id: "navy-hopsack",
    name: "Midnight navy hopsack",
    mill: "Vitale Barberis Canonico",
    color: "Midnight navy",
    composition: "100% worsted wool",
    weight: "280g",
    seasonality: "Four season",
    description:
      "An open-weave Italian wool with a clean drape, subtle texture, and natural breathability.",
  },
  greyTraveller: {
    id: "grey-traveller",
    name: "Slate grey traveller wool",
    mill: "Reda",
    color: "Slate grey",
    composition: "100% high-twist wool",
    weight: "270g",
    seasonality: "Four season",
    description:
      "A resilient high-twist wool designed to recover its shape and travel with ease.",
  },
  oliveFlannel: {
    id: "olive-flannel",
    name: "Dark olive brushed flannel",
    mill: "Fox Brothers",
    color: "Dark olive",
    composition: "100% wool",
    weight: "310g",
    seasonality: "Autumn and winter",
    description:
      "A softly brushed British flannel with depth of color and an easy, tactile finish.",
  },
  charcoalSerge: {
    id: "charcoal-serge",
    name: "Charcoal pick-and-pick",
    mill: "Drago",
    color: "Charcoal",
    composition: "100% Super 130s wool",
    weight: "260g",
    seasonality: "Four season",
    description:
      "A finely woven pick-and-pick cloth with a quiet lustre and a polished formal character.",
  },
  midnightBarathea: {
    id: "midnight-barathea",
    name: "Midnight barathea",
    mill: "Vitale Barberis Canonico",
    color: "Midnight blue",
    composition: "100% wool",
    weight: "290g",
    seasonality: "Evening",
    description:
      "A deep midnight barathea with a refined grain that reads elegantly under evening light.",
  },
  stoneWoolLinen: {
    id: "stone-wool-linen",
    name: "Stone wool-linen",
    mill: "Loro Piana",
    color: "Warm stone",
    composition: "54% wool, 46% linen",
    weight: "250g",
    seasonality: "Spring and summer",
    description:
      "A breathable wool-linen blend with a relaxed surface and enough body to hold its line.",
  },
};

const houseOptions: CustomizationOption[] = [
  {
    id: "notch-lapel",
    group: "Jacket",
    name: "Notch lapel",
    description: "A balanced 3.5 inch lapel with a clean everyday line.",
  },
  {
    id: "peak-lapel",
    group: "Jacket",
    name: "Peak lapel",
    description: "A sharper, more expressive jacket profile.",
    priceModifier: { amount: 75, label: "Add $75" },
  },
  {
    id: "side-adjusters",
    group: "Trouser",
    name: "Side adjusters",
    description: "A streamlined waistband without belt loops.",
  },
  {
    id: "personal-monogram",
    group: "Finishing",
    name: "Personal monogram",
    description: "Up to three initials hand-finished inside the jacket.",
    priceModifier: { amount: 35, label: "Add $35" },
  },
];

export const products: Product[] = [
  {
    id: "house-navy",
    slug: "house-navy-hopsack-suit",
    name: "The House Suit",
    color: "Midnight Navy",
    categoryId: "business",
    description:
      "The foundation of a modern tailoring wardrobe: softly structured, quietly confident, and built for repeat wear.",
    details:
      "Our signature two-button suit is cut with a natural shoulder, a lightly suppressed waist, and a clean trouser line. Midnight hopsack brings enough texture for depth while remaining understated from meeting to dinner.",
    images: [
      {
        src: "/images/suit-navy.png",
        alt: "Model wearing The House Suit in midnight navy",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Close view of a tailored navy suit jacket",
      },
    ],
    basePrice: 1195,
    fabric: fabrics.navyHopsack,
    customizationOptions: houseOptions,
    badge: "House favorite",
    featured: true,
  },
  {
    id: "travel-grey",
    slug: "travel-slate-grey-suit",
    name: "The Travel Suit",
    color: "Slate Grey",
    categoryId: "business",
    description:
      "Resilient high-twist wool with natural recovery, designed for days that do not stay in one place.",
    details:
      "A dependable two-button suit with a half canvas construction and a slightly softer shoulder. The cloth resists creasing and holds a crisp line through flights, long days, and late arrivals.",
    images: [
      {
        src: "/images/suit-grey.png",
        alt: "Model wearing The Travel Suit in slate grey",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Close view of tailored wool suiting",
      },
    ],
    basePrice: 1295,
    fabric: fabrics.greyTraveller,
    customizationOptions: houseOptions,
    badge: "Travel ready",
    featured: true,
  },
  {
    id: "weekend-olive",
    slug: "weekend-dark-olive-flannel-suit",
    name: "The Weekend Suit",
    color: "Dark Olive",
    categoryId: "seasonal",
    description:
      "Relaxed tailoring in a softly brushed olive flannel with a warm, understated point of view.",
    details:
      "The Weekend Suit pares back the structure without losing shape. Its olive flannel is easy to separate: wear the jacket with denim or the trousers with knitwear when a full suit feels too formal.",
    images: [
      {
        src: "/images/suit-olive.png",
        alt: "Model wearing The Weekend Suit in dark olive",
      },
      {
        src: "/images/suit-grey.png",
        alt: "Detail of softly tailored suiting",
      },
    ],
    basePrice: 1245,
    fabric: fabrics.oliveFlannel,
    customizationOptions: houseOptions,
    badge: "New season",
    featured: true,
  },
  {
    id: "signature-charcoal",
    slug: "signature-charcoal-double-breasted-suit",
    name: "The Signature DB",
    color: "Charcoal",
    categoryId: "business",
    description:
      "A composed double-breasted silhouette in charcoal pick-and-pick wool, cut with presence and restraint.",
    details:
      "A six-button double-breasted jacket with a broad peak lapel, softly roped shoulder, and balanced length. The charcoal cloth gives the statement silhouette an understated, versatile finish.",
    images: [
      {
        src: "/images/hero-tailoring.png",
        alt: "Model wearing The Signature double-breasted suit in charcoal",
      },
      {
        src: "/images/suit-grey.png",
        alt: "Close view of charcoal suit fabric and lapel",
      },
    ],
    basePrice: 1495,
    fabric: fabrics.charcoalSerge,
    customizationOptions: houseOptions,
  },
  {
    id: "occasion-midnight",
    slug: "occasion-midnight-blue-suit",
    name: "The Occasion Suit",
    color: "Midnight Blue",
    categoryId: "occasion",
    description:
      "A refined evening suit in midnight barathea, designed for black-tie optional celebrations and late dinners.",
    details:
      "Deeper and more nuanced than black, midnight barathea comes alive after dark. The house shoulder and peak lapel lend polish without making the garment feel reserved for a single occasion.",
    images: [
      {
        src: "/images/suit-navy.png",
        alt: "Model wearing The Occasion Suit in midnight blue",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Detail of a dark evening suit",
      },
    ],
    basePrice: 1395,
    fabric: fabrics.midnightBarathea,
    customizationOptions: houseOptions,
  },
  {
    id: "summer-stone",
    slug: "summer-stone-wool-linen-suit",
    name: "The Summer Suit",
    color: "Warm Stone",
    categoryId: "seasonal",
    description:
      "An unlined wool-linen suit with a relaxed surface, considered for warm days and destination occasions.",
    details:
      "Warm stone wool-linen brings quiet texture to a lighter construction. The jacket is softly made and half lined, while the trouser is cut with room to move in warmer weather.",
    images: [
      {
        src: "/images/suit-grey.png",
        alt: "Model wearing The Summer Suit in warm stone",
      },
      {
        src: "/images/suit-olive.png",
        alt: "Detail of relaxed wool-linen tailoring",
      },
    ],
    basePrice: 1325,
    fabric: fabrics.stoneWoolLinen,
    customizationOptions: houseOptions,
    badge: "Limited cloth",
  },
];

export function getCategory(categoryId: string) {
  return categories.find((category) => category.id === categoryId);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}
