import { CartView } from "@/components/cart/cart-view";
import { PageContainer } from "@/components/layout/page-container";

export default function CartPage() {
  const checkoutEnabled = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_APP_URL &&
      process.env.NEXT_PUBLIC_CONVEX_URL,
  );

  return (
    <PageContainer className="py-16 sm:py-20 lg:py-24">
      <CartView checkoutEnabled={checkoutEnabled} />
    </PageContainer>
  );
}
