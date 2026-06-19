export function isCheckoutConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_WEBHOOK_PROCESSING_SECRET &&
    process.env.USPS_CLIENT_ID &&
    process.env.USPS_CLIENT_SECRET &&
    process.env.USPS_VALIDATION_PROCESSING_SECRET &&
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_CONVEX_URL,
  );
}
