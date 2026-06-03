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
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Midnight navy hopsack suit fabric preview",
    },
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
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Slate grey traveller wool suit fabric preview",
    },
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
    imageReference: {
      src: "/images/suit-olive.png",
      alt: "Dark olive brushed flannel suit fabric preview",
    },
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
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Charcoal pick-and-pick suit fabric preview",
    },
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
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Midnight barathea evening suit fabric preview",
    },
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
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Stone wool-linen summer suit fabric preview",
    },
    displayOrder: 60,
  },
] as const;

export const customizationGroupSeeds = [
  {
    code: "jacket-style",
    label: "Jacket style",
    description: "Choose the jacket silhouette and closure.",
    displayOrder: 10,
  },
  {
    code: "lapel",
    label: "Lapel",
    description: "Set the lapel shape and level of formality.",
    displayOrder: 20,
  },
  {
    code: "buttons",
    label: "Buttons",
    description: "Select the button material and finish.",
    displayOrder: 30,
  },
  {
    code: "pockets",
    label: "Pockets",
    description: "Choose the jacket pocket treatment.",
    displayOrder: 40,
  },
  {
    code: "trousers",
    label: "Trousers",
    description: "Choose the trouser waistband and front.",
    displayOrder: 50,
  },
  {
    code: "extras",
    label: "Vest & extras",
    description: "Add optional pieces and hand-finished details.",
    displayOrder: 60,
  },
] as const;

export const customizationOptionSeeds = [
  {
    code: "single-breasted-two-button",
    groupCode: "jacket-style",
    label: "Two-button single-breasted",
    description: "The house cut with a clean front and versatile stance.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Two-button single-breasted suit jacket preview",
    },
    displayOrder: 10,
  },
  {
    code: "single-breasted-one-button",
    groupCode: "jacket-style",
    label: "One-button evening",
    description: "A lower, sharper front for formal or occasion tailoring.",
    priceModifierCents: 4500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "One-button evening jacket preview",
    },
    displayOrder: 20,
  },
  {
    code: "double-breasted-six-button",
    groupCode: "jacket-style",
    label: "Six-button double-breasted",
    description: "A composed wrap front with broader presence.",
    priceModifierCents: 15000,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Six-button double-breasted suit jacket preview",
    },
    displayOrder: 30,
  },
  {
    code: "notch-lapel",
    groupCode: "lapel",
    label: "Notch lapel",
    description: "A balanced 3.5 inch lapel with a clean everyday line.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Notch lapel suit detail preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "requires",
          groupCode: "jacket-style",
          optionCodes: [
            "single-breasted-two-button",
            "single-breasted-one-button",
          ],
          reason: "Notch lapels are available on single-breasted jackets only.",
        },
      ],
    },
    displayOrder: 10,
  },
  {
    code: "peak-lapel",
    groupCode: "lapel",
    label: "Peak lapel",
    description: "A sharper, more expressive jacket profile.",
    priceModifierCents: 7500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Peak lapel suit detail preview",
    },
    displayOrder: 20,
  },
  {
    code: "shawl-lapel",
    groupCode: "lapel",
    label: "Shawl lapel",
    description: "A continuous formal roll for evening tailoring.",
    priceModifierCents: 12500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Shawl lapel evening jacket detail preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "requires",
          groupCode: "jacket-style",
          optionCodes: ["single-breasted-one-button"],
          reason: "Shawl lapels are reserved for one-button evening jackets.",
        },
      ],
    },
    displayOrder: 30,
  },
  {
    code: "horn-buttons",
    groupCode: "buttons",
    label: "Dark horn",
    description: "Natural horn buttons with a quiet polished surface.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Dark horn buttons on a suit jacket preview",
    },
    displayOrder: 10,
  },
  {
    code: "smoked-pearl-buttons",
    groupCode: "buttons",
    label: "Smoked pearl",
    description: "A subtle pearlescent finish for depth and contrast.",
    priceModifierCents: 4500,
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Smoked pearl suit buttons preview",
    },
    displayOrder: 20,
  },
  {
    code: "covered-buttons",
    groupCode: "buttons",
    label: "Self-covered",
    description: "Cloth-covered buttons for a formal evening finish.",
    priceModifierCents: 6500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Self-covered evening suit buttons preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "requires",
          groupCode: "lapel",
          optionCodes: ["peak-lapel", "shawl-lapel"],
          reason: "Covered buttons are reserved for peak or shawl lapels.",
        },
      ],
    },
    displayOrder: 30,
  },
  {
    code: "straight-flap-pockets",
    groupCode: "pockets",
    label: "Straight flap",
    description: "Classic flap pockets with a clean horizontal line.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Straight flap suit pocket preview",
    },
    displayOrder: 10,
  },
  {
    code: "slanted-flap-pockets",
    groupCode: "pockets",
    label: "Slanted flap",
    description: "A slightly sportier angle that lengthens the jacket line.",
    priceModifierCents: 3500,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Slanted flap suit pocket preview",
    },
    displayOrder: 20,
  },
  {
    code: "patch-pockets",
    groupCode: "pockets",
    label: "Patch pockets",
    description: "A softer pocket for relaxed tailoring and separates.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-olive.png",
      alt: "Patch pocket suit jacket preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "excludes",
          groupCode: "jacket-style",
          optionCodes: ["double-breasted-six-button"],
          reason: "Patch pockets are not offered on double-breasted jackets.",
        },
      ],
    },
    displayOrder: 30,
  },
  {
    code: "jetted-pockets",
    groupCode: "pockets",
    label: "Jetted pockets",
    description: "A clean formal pocket without flaps.",
    priceModifierCents: 4500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Jetted formal suit pocket preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "requires",
          groupCode: "lapel",
          optionCodes: ["peak-lapel", "shawl-lapel"],
          reason: "Jetted pockets are reserved for formal lapel choices.",
        },
      ],
    },
    displayOrder: 40,
  },
  {
    code: "side-adjusters",
    groupCode: "trousers",
    label: "Side adjusters",
    description: "A streamlined waistband without belt loops.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Side adjuster trouser waistband preview",
    },
    displayOrder: 10,
  },
  {
    code: "belt-loops",
    groupCode: "trousers",
    label: "Belt loops",
    description: "A familiar trouser finish for daily wear.",
    priceModifierCents: 0,
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Belt loop trouser waistband preview",
    },
    displayOrder: 20,
  },
  {
    code: "single-pleat-trousers",
    groupCode: "trousers",
    label: "Single pleat",
    description: "A little extra room through the front with a tailored line.",
    priceModifierCents: 3500,
    imageReference: {
      src: "/images/suit-olive.png",
      alt: "Single pleat suit trousers preview",
    },
    displayOrder: 30,
  },
  {
    code: "brace-buttons",
    groupCode: "trousers",
    label: "Brace buttons",
    description: "Interior buttons for braces with no exterior interruption.",
    priceModifierCents: 2500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Brace button trouser detail preview",
    },
    displayOrder: 40,
  },
  {
    code: "matching-waistcoat",
    groupCode: "extras",
    label: "Matching waistcoat",
    description: "Add a five-button vest cut from the same cloth.",
    priceModifierCents: 22500,
    imageReference: {
      src: "/images/suit-navy.png",
      alt: "Matching waistcoat suit preview",
    },
    compatibilityMetadata: {
      rules: [
        {
          type: "excludes",
          groupCode: "jacket-style",
          optionCodes: ["double-breasted-six-button"],
          reason: "Waistcoats are only offered with single-breasted jackets.",
        },
      ],
    },
    displayOrder: 10,
  },
  {
    code: "personal-monogram",
    groupCode: "extras",
    label: "Personal monogram",
    description: "Up to three initials hand-finished inside the jacket.",
    priceModifierCents: 3500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Personal monogram inside a tailored jacket preview",
    },
    displayOrder: 20,
  },
  {
    code: "working-cuffs",
    groupCode: "extras",
    label: "Working cuffs",
    description: "Functional buttonholes finished at the sleeve.",
    priceModifierCents: 9500,
    imageReference: {
      src: "/images/suit-grey.png",
      alt: "Working cuff buttonholes preview",
    },
    displayOrder: 30,
  },
  {
    code: "full-canvas-upgrade",
    groupCode: "extras",
    label: "Full canvas upgrade",
    description: "A fully canvassed jacket front for maximum longevity.",
    priceModifierCents: 18500,
    imageReference: {
      src: "/images/hero-tailoring.png",
      alt: "Full canvas tailoring construction preview",
    },
    displayOrder: 40,
  },
] as const;

const houseOptionCodes = [
  "single-breasted-two-button",
  "single-breasted-one-button",
  "double-breasted-six-button",
  "notch-lapel",
  "peak-lapel",
  "shawl-lapel",
  "horn-buttons",
  "smoked-pearl-buttons",
  "covered-buttons",
  "straight-flap-pockets",
  "slanted-flap-pockets",
  "patch-pockets",
  "jetted-pockets",
  "side-adjusters",
  "belt-loops",
  "single-pleat-trousers",
  "brace-buttons",
  "matching-waistcoat",
  "personal-monogram",
  "working-cuffs",
  "full-canvas-upgrade",
];

const doubleBreastedOptionCodes = [
  "double-breasted-six-button",
  "peak-lapel",
  "horn-buttons",
  "smoked-pearl-buttons",
  "covered-buttons",
  "straight-flap-pockets",
  "slanted-flap-pockets",
  "jetted-pockets",
  "side-adjusters",
  "belt-loops",
  "single-pleat-trousers",
  "brace-buttons",
  "personal-monogram",
  "working-cuffs",
  "full-canvas-upgrade",
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
    customizationOptionCodes: doubleBreastedOptionCodes,
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
    customizationOptionCodes: houseOptionCodes.filter(
      (code) => code !== "double-breasted-six-button",
    ),
  },
] as const;
