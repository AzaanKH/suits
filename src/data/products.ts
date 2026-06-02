export type Product = {
  id: string;
  name: string;
  color: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Price in US dollars. */
  price: number;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "house-navy",
    name: "The House Suit",
    color: "Midnight Navy",
    category: "Core Collection",
    description: "A softly structured two-button suit in year-round wool.",
    image: "/images/suit-navy.png",
    imageAlt: "Model wearing The House Suit in midnight navy",
    price: 1195,
    badge: "House favorite",
  },
  {
    id: "travel-grey",
    name: "The Travel Suit",
    color: "Flannel Gray",
    category: "Core Collection",
    description: "Resilient wool with natural stretch and a clean drape.",
    image: "/images/suit-grey.png",
    imageAlt: "Model wearing The Travel Suit in flannel gray",
    price: 1295,
  },
  {
    id: "weekend-olive",
    name: "The Weekend Suit",
    color: "Dark Olive",
    category: "Seasonal Edit",
    description: "Relaxed tailoring in a softly textured olive cloth.",
    image: "/images/suit-olive.png",
    imageAlt: "Model wearing The Weekend Suit in dark olive",
    price: 1245,
    badge: "New season",
  },
  {
    id: "signature-charcoal",
    name: "The Signature DB",
    color: "Charcoal",
    category: "Signature Collection",
    description: "A confident double-breasted silhouette with a natural line.",
    image: "/images/hero-tailoring.png",
    imageAlt: "Model wearing The Signature double-breasted suit in charcoal",
    price: 1495,
  },
  {
    id: "occasion-midnight",
    name: "The Occasion Suit",
    color: "Deep Navy",
    category: "Evening",
    description: "A refined dark navy cloth with subtle depth for evening.",
    image: "/images/suit-navy.png",
    imageAlt: "Model wearing The Occasion Suit in deep navy",
    price: 1395,
  },
  {
    id: "soft-tailored-grey",
    name: "The Unstructured Suit",
    color: "Soft Gray",
    category: "Seasonal Edit",
    description: "An easy, unlined expression of the house silhouette.",
    image: "/images/suit-grey.png",
    imageAlt: "Model wearing The Unstructured Suit in soft gray",
    price: 1175,
  },
];
