export type ProductImage = {
  src: string;
  alt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type Fabric = {
  id: string;
  code: string;
  name: string;
  mill: string;
  color: string;
  composition: string;
  weight: string;
  seasonality: string;
  description: string;
};

export type CustomizationGroup = {
  id: string;
  code: string;
  label: string;
  description: string;
  displayOrder: number;
};

export type CustomizationOption = {
  id: string;
  code: string;
  label: string;
  description: string;
  priceModifierCents: number;
  imageReference?: ProductImage;
  compatibilityMetadata?: unknown;
  displayOrder: number;
  group: CustomizationGroup;
};

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  color: string;
  images: ProductImage[];
  basePriceCents: number;
  badge?: string;
  featured: boolean;
};

export type Product = ProductSummary & {
  shortDescription: string;
  fullDescription: string;
  displayOrder: number;
  category: Pick<Category, "id" | "slug" | "name"> | null;
  availableFabrics: Fabric[];
};
