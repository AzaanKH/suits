export const categorySeeds = [
  {
    slug: "business",
    name: "Business",
    description: "Versatile tailoring for a working wardrobe.",
    displayOrder: 10,
  },
  {
    slug: "occasion",
    name: "Occasion",
    description: "Refined silhouettes for evenings and significant moments.",
    displayOrder: 20,
  },
  {
    slug: "seasonal",
    name: "Seasonal",
    description: "Textural cloths and softer expressions of the house cut.",
    displayOrder: 30,
  },
] as const;

export const fabricSeeds = [
  {
    code: "navy-hopsack",
    name: "Midnight navy hopsack",
    mill: "Vitale Barberis Canonico",
    color: "Midnight Navy",
    composition: "100% worsted wool",
    weight: "280g",
    seasonality: "Four season",
    description:
      "An open-weave Italian wool with a clean drape, subtle texture, and natural breathability.",
    displayOrder: 10,
  },
  {
    code: "grey-traveller",
    name: "Slate grey traveller wool",
    mill: "Reda",
    color: "Slate Grey",
    composition: "100% high-twist wool",
    weight: "270g",
    seasonality: "Four season",
    description:
      "A resilient high-twist wool designed to recover its shape and travel with ease.",
    displayOrder: 20,
  },
  {
    code: "olive-flannel",
    name: "Dark olive brushed flannel",
    mill: "Fox Brothers",
    color: "Dark Olive",
    composition: "100% wool",
    weight: "310g",
    seasonality: "Autumn and winter",
    description:
      "A softly brushed British flannel with depth of color and an easy, tactile finish.",
    displayOrder: 30,
  },
  {
    code: "charcoal-pick-and-pick",
    name: "Charcoal pick-and-pick",
    mill: "Drago",
    color: "Charcoal",
    composition: "100% Super 130s wool",
    weight: "260g",
    seasonality: "Four season",
    description:
      "A finely woven pick-and-pick cloth with a quiet lustre and a polished formal character.",
    displayOrder: 40,
  },
  {
    code: "midnight-barathea",
    name: "Midnight barathea",
    mill: "Vitale Barberis Canonico",
    color: "Midnight Blue",
    composition: "100% wool",
    weight: "290g",
    seasonality: "Evening",
    description:
      "A deep midnight barathea with a refined grain that reads elegantly under evening light.",
    displayOrder: 50,
  },
  {
    code: "stone-wool-linen",
    name: "Stone wool-linen",
    mill: "Loro Piana",
    color: "Warm Stone",
    composition: "54% wool, 46% linen",
    weight: "250g",
    seasonality: "Spring and summer",
    description:
      "A breathable wool-linen blend with a relaxed surface and enough body to hold its line.",
    displayOrder: 60,
  },
] as const;

export const customizationGroupSeeds = [
  {
    code: "jacket",
    label: "Jacket",
    description: "Shape the jacket silhouette and front.",
    displayOrder: 10,
  },
  {
    code: "trouser",
    label: "Trouser",
    description: "Choose a considered trouser finish.",
    displayOrder: 20,
  },
  {
    code: "lining",
    label: "Lining",
    description: "Select the interior finish of the jacket.",
    displayOrder: 30,
  },
  {
    code: "finishing",
    label: "Finishing",
    description: "Add personal finishing details.",
    displayOrder: 40,
  },
] as const;

export const customizationOptionSeeds = [
  {
    code: "notch-lapel",
    groupCode: "jacket",
    label: "Notch lapel",
    description: "A balanced 3.5 inch lapel with a clean everyday line.",
    priceModifierCents: 0,
    compatibilityMetadata: { silhouettes: ["single-breasted"] },
    displayOrder: 10,
  },
  {
    code: "peak-lapel",
    groupCode: "jacket",
    label: "Peak lapel",
    description: "A sharper, more expressive jacket profile.",
    priceModifierCents: 7500,
    compatibilityMetadata: {
      silhouettes: ["single-breasted", "double-breasted"],
    },
    displayOrder: 20,
  },
  {
    code: "side-adjusters",
    groupCode: "trouser",
    label: "Side adjusters",
    description: "A streamlined waistband without belt loops.",
    priceModifierCents: 0,
    displayOrder: 10,
  },
  {
    code: "belt-loops",
    groupCode: "trouser",
    label: "Belt loops",
    description: "A familiar trouser finish for daily wear.",
    priceModifierCents: 0,
    displayOrder: 20,
  },
  {
    code: "half-lined",
    groupCode: "lining",
    label: "Half lined",
    description: "Reduced lining for a lighter, more breathable jacket.",
    priceModifierCents: 0,
    compatibilityMetadata: { seasons: ["spring", "summer"] },
    displayOrder: 10,
  },
  {
    code: "full-lined",
    groupCode: "lining",
    label: "Full lined",
    description: "A traditional full lining for a smooth, structured finish.",
    priceModifierCents: 0,
    displayOrder: 20,
  },
  {
    code: "personal-monogram",
    groupCode: "finishing",
    label: "Personal monogram",
    description: "Up to three initials hand-finished inside the jacket.",
    priceModifierCents: 3500,
    displayOrder: 10,
  },
  {
    code: "working-cuffs",
    groupCode: "finishing",
    label: "Working cuffs",
    description: "Functional buttonholes finished at the sleeve.",
    priceModifierCents: 9500,
    displayOrder: 20,
  },
] as const;

const houseOptionCodes = [
  "notch-lapel",
  "peak-lapel",
  "side-adjusters",
  "belt-loops",
  "full-lined",
  "personal-monogram",
  "working-cuffs",
];

export const productSeeds = [
  {
    slug: "house-navy-hopsack-suit",
    name: "The House Suit",
    shortDescription:
      "The foundation of a modern tailoring wardrobe: softly structured, quietly confident, and built for repeat wear.",
    fullDescription:
      "Our signature two-button suit is cut with a natural shoulder, a lightly suppressed waist, and a clean trouser line. Midnight hopsack brings enough texture for depth while remaining understated from meeting to dinner.",
    basePriceCents: 119500,
    categorySlug: "business",
    imageReferences: [
      {
        src: "/images/suit-navy.png",
        alt: "Model wearing The House Suit in midnight navy",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Close view of a tailored navy suit jacket",
      },
    ],
    badge: "House favorite",
    featured: true,
    displayOrder: 10,
    fabricCodes: ["navy-hopsack", "grey-traveller"],
    customizationOptionCodes: houseOptionCodes,
  },
  {
    slug: "travel-slate-grey-suit",
    name: "The Travel Suit",
    shortDescription:
      "Resilient high-twist wool with natural recovery, designed for days that do not stay in one place.",
    fullDescription:
      "A dependable two-button suit with a half canvas construction and a slightly softer shoulder. The cloth resists creasing and holds a crisp line through flights, long days, and late arrivals.",
    basePriceCents: 129500,
    categorySlug: "business",
    imageReferences: [
      {
        src: "/images/suit-grey.png",
        alt: "Model wearing The Travel Suit in slate grey",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Close view of tailored wool suiting",
      },
    ],
    badge: "Travel ready",
    featured: true,
    displayOrder: 20,
    fabricCodes: ["grey-traveller", "navy-hopsack"],
    customizationOptionCodes: houseOptionCodes,
  },
  {
    slug: "weekend-dark-olive-flannel-suit",
    name: "The Weekend Suit",
    shortDescription:
      "Relaxed tailoring in a softly brushed olive flannel with a warm, understated point of view.",
    fullDescription:
      "The Weekend Suit pares back the structure without losing shape. Its olive flannel is easy to separate: wear the jacket with denim or the trousers with knitwear when a full suit feels too formal.",
    basePriceCents: 124500,
    categorySlug: "seasonal",
    imageReferences: [
      {
        src: "/images/suit-olive.png",
        alt: "Model wearing The Weekend Suit in dark olive",
      },
      {
        src: "/images/suit-grey.png",
        alt: "Detail of softly tailored suiting",
      },
    ],
    badge: "New season",
    featured: true,
    displayOrder: 30,
    fabricCodes: ["olive-flannel"],
    customizationOptionCodes: houseOptionCodes,
  },
  {
    slug: "signature-charcoal-double-breasted-suit",
    name: "The Signature DB",
    shortDescription:
      "A composed double-breasted silhouette in charcoal pick-and-pick wool, cut with presence and restraint.",
    fullDescription:
      "A six-button double-breasted jacket with a broad peak lapel, softly roped shoulder, and balanced length. The charcoal cloth gives the statement silhouette an understated, versatile finish.",
    basePriceCents: 149500,
    categorySlug: "business",
    imageReferences: [
      {
        src: "/images/hero-tailoring.png",
        alt: "Model wearing The Signature double-breasted suit in charcoal",
      },
      {
        src: "/images/suit-grey.png",
        alt: "Close view of charcoal suit fabric and lapel",
      },
    ],
    featured: false,
    displayOrder: 40,
    fabricCodes: ["charcoal-pick-and-pick", "navy-hopsack"],
    customizationOptionCodes: houseOptionCodes.filter(
      (code) => code !== "notch-lapel",
    ),
  },
  {
    slug: "occasion-midnight-blue-suit",
    name: "The Occasion Suit",
    shortDescription:
      "A refined evening suit in midnight barathea, designed for black-tie optional celebrations and late dinners.",
    fullDescription:
      "Deeper and more nuanced than black, midnight barathea comes alive after dark. The house shoulder and peak lapel lend polish without making the garment feel reserved for a single occasion.",
    basePriceCents: 139500,
    categorySlug: "occasion",
    imageReferences: [
      {
        src: "/images/suit-navy.png",
        alt: "Model wearing The Occasion Suit in midnight blue",
      },
      {
        src: "/images/hero-tailoring.png",
        alt: "Detail of a dark evening suit",
      },
    ],
    featured: false,
    displayOrder: 50,
    fabricCodes: ["midnight-barathea"],
    customizationOptionCodes: houseOptionCodes,
  },
  {
    slug: "summer-stone-wool-linen-suit",
    name: "The Summer Suit",
    shortDescription:
      "An unlined wool-linen suit with a relaxed surface, considered for warm days and destination occasions.",
    fullDescription:
      "Warm stone wool-linen brings quiet texture to a lighter construction. The jacket is softly made and half lined, while the trouser is cut with room to move in warmer weather.",
    basePriceCents: 132500,
    categorySlug: "seasonal",
    imageReferences: [
      {
        src: "/images/suit-grey.png",
        alt: "Model wearing The Summer Suit in warm stone",
      },
      {
        src: "/images/suit-olive.png",
        alt: "Detail of relaxed wool-linen tailoring",
      },
    ],
    badge: "Limited cloth",
    featured: false,
    displayOrder: 60,
    fabricCodes: ["stone-wool-linen"],
    customizationOptionCodes: [
      "notch-lapel",
      "peak-lapel",
      "side-adjusters",
      "belt-loops",
      "half-lined",
      "personal-monogram",
      "working-cuffs",
    ],
  },
] as const;
