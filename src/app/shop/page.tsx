import { PageContainer } from "@/components/layout/page-container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { products } from "@/data/products";

export default function ShopPage() {
  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <SectionHeading
        title="Suits, considered."
        description="A focused edit of house signatures, soft tailoring, and occasion pieces. Every style is made to your measurements and finished to your preferences."
      />
      <div className="border-border text-muted-foreground mt-10 flex flex-wrap gap-x-6 gap-y-3 border-y py-4 text-sm font-bold tracking-[0.08em] uppercase">
        <span className="text-ink">All suits</span>
        <span>Core collection</span>
        <span>Seasonal edit</span>
        <span>Evening</span>
      </div>
      <ProductGrid products={products} className="mt-10" />
    </PageContainer>
  );
}
