import { CartView } from "@/components/cart/cart-view";
import { PageContainer } from "@/components/layout/page-container";
import { isCheckoutConfigured } from "@/lib/checkout-config";

export default function CartPage() {
  const checkoutEnabled = isCheckoutConfigured();

  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <CartView checkoutEnabled={checkoutEnabled} />
    </PageContainer>
  );
}
