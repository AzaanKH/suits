export type PriceModifier = {
  amount: number;
  label: string;
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Fabric = {
  id: string;
  name: string;
  mill: string;
  color: string;
  composition: string;
  weight: string;
  seasonality: string;
  description: string;
};

export type CustomizationOption = {
  id: string;
  group: "Jacket" | "Trouser" | "Finishing";
  name: string;
  description: string;
  priceModifier?: PriceModifier;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  color: string;
  categoryId: Category["id"];
  description: string;
  details: string;
  images: ProductImage[];
  basePrice: number;
  fabric: Fabric;
  customizationOptions: CustomizationOption[];
  badge?: string;
  featured?: boolean;
};
