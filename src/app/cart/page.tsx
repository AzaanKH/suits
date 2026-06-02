import { CartView } from "@/components/cart/cart-view";
import { PageContainer } from "@/components/layout/page-container";

export default function CartPage() {
  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <CartView />
    </PageContainer>
  );
}
