import type { Metadata } from "next";

import { SuitCustomizer } from "@/features/customizer/components/suit-customizer";

type CustomizePageProps = {
  params: Promise<{ productSlug: string }>;
};

export const metadata: Metadata = {
  title: "Customize suit",
  description: "Build a made-to-measure suit configuration.",
};

export default async function CustomizePage({ params }: CustomizePageProps) {
  const { productSlug } = await params;
  const threeDimensionalPreviewEnabled =
    process.env.ENABLE_3D_CONFIGURATOR === "true";

  return (
    <SuitCustomizer
      productSlug={productSlug}
      threeDimensionalPreviewEnabled={threeDimensionalPreviewEnabled}
    />
  );
}
