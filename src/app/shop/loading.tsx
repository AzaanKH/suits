import { PageContainer } from "@/components/layout/page-container";
import { ProductGridSkeleton } from "@/components/storefront/loading-skeleton";

export default function ShopLoading() {
  return (
    <PageContainer className="py-16 sm:py-20">
      <div className="h-32" />
      <ProductGridSkeleton />
    </PageContainer>
  );
}
