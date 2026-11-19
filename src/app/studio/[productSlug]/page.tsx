import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SuitStudioExperience } from "@/features/customizer/components/suit-studio-experience";

type StudioPageProps = {
  params: Promise<{ productSlug: string }>;
};

export const metadata: Metadata = {
  title: "Suit studio",
  description: "Design your suit in a full-screen 3D studio.",
};

export default async function StudioPage({ params }: StudioPageProps) {
  const { productSlug } = await params;
  if (process.env.ENABLE_3D_CONFIGURATOR === "false")
    redirect(`/customize/${productSlug}`);

  return <SuitStudioExperience productSlug={productSlug} />;
}
