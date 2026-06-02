import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ShopCatalog } from "@/components/storefront/shop-catalog";
import { products } from "@/data/products";

export default function ShopPage() {
  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <SectionHeading
        title="Suits, considered."
        description="A focused edit of house signatures, soft tailoring, and occasion pieces. Every style is made to your measurements and finished to your preferences."
      />
      <ShopCatalog products={products} />
    </PageContainer>
  );
}
