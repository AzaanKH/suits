import type { Metadata } from "next";

import { ProductDetail } from "@/components/storefront/product-detail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Custom suit",
  description: "Explore cloth and customization options for this custom suit.",
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductDetail slug={slug} />;
}
