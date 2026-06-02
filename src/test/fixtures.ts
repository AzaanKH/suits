import type { ProductSummary } from "@/types";

export const productFixtures: ProductSummary[] = [
  {
    id: "house-navy",
    slug: "house-navy-hopsack-suit",
    name: "The House Suit",
    color: "Midnight Navy",
    images: [
      {
        src: "/images/suit-navy.png",
        alt: "Model wearing The House Suit in midnight navy",
      },
    ],
    basePriceCents: 119500,
    badge: "House favorite",
    featured: true,
  },
  {
    id: "travel-grey",
    slug: "travel-slate-grey-suit",
    name: "The Travel Suit",
    color: "Slate Grey",
    images: [
      {
        src: "/images/suit-grey.png",
        alt: "Model wearing The Travel Suit in slate grey",
      },
    ],
    basePriceCents: 129500,
    badge: "Travel ready",
    featured: true,
  },
];
