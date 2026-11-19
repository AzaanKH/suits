import { Palette, Ruler, ShoppingBag } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ShopCatalog } from "@/components/storefront/shop-catalog";

const shopBenefits = [
  {
    icon: Palette,
    title: "Every suit configures",
    description: "Start from a house cut, then choose cloth and finishing.",
  },
  {
    icon: Ruler,
    title: "Fit comes before cart",
    description: "Select standard sizing or made to measure in the flow.",
  },
  {
    icon: ShoppingBag,
    title: "Review before checkout",
    description: "See the final configuration and price before adding to cart.",
  },
];

export default function ShopPage() {
  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <SectionHeading
        title="Suits, considered."
        description="A focused edit of house signatures, soft tailoring, and occasion pieces. Configure online, then choose standard fit or made to measure."
      />
      <div className="border-border mt-10 grid gap-4 border-y py-5 sm:grid-cols-3">
        {shopBenefits.map(({ icon: Icon, title, description }) => (
          <div className="flex gap-3" key={title}>
            <Icon
              aria-hidden="true"
              className="text-accent-strong mt-0.5 size-4 shrink-0"
            />
            <div>
              <p className="text-ink text-sm font-bold">{title}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <ShopCatalog />
    </PageContainer>
  );
}
