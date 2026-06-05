# Convex storefront schema

The storefront uses twelve tables:

| Table                              | Purpose                                                                                                                                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products`                         | Sellable suit foundations, pricing, copy, images, status, ordering, and fabric availability.                                                                                                                                                          |
| `categories`                       | Active catalog filters such as business, occasion, and seasonal.                                                                                                                                                                                      |
| `fabrics`                          | Reusable cloth records with mill, composition, weight, seasonality, and descriptive copy.                                                                                                                                                             |
| `customizationGroups`              | Ordered configurator sections such as jacket, trouser, lining, and finishing.                                                                                                                                                                         |
| `customizationOptions`             | Stable option codes, price modifiers in integer cents, presentation data, and open-ended compatibility metadata.                                                                                                                                      |
| `productCustomizationAvailability` | Explicit product-to-option join rows. Each row also stores the option's group ID for efficient product/group lookups.                                                                                                                                 |
| `savedDesigns`                     | Authenticated saved configurations keyed by owner Clerk user id with product IDs, names, server-priced snapshots, and previews.                                                                                                                       |
| `measurementProfiles`              | Authenticated user measurement templates keyed by owner Clerk user id with profile name, units, body measurements, fit preferences, notes, and timestamps. Saved designs, carts, and orders reference profile IDs/names for personalized fit lookups. |
| `carts`                            | Authenticated cart records keyed by owner Clerk user id with immutable configured line snapshots, server-priced unit amounts, quantities, and timestamps.                                                                                             |
| `orders`                           | Authenticated order headers keyed by owner Clerk user id with Stripe IDs, shipping, totals, payment status, fulfillment status, and timestamps.                                                                                                       |
| `orderItems`                       | Normalized order line snapshots with product, configuration, selections, personalization, fit, measurement, quantity, and cents-based pricing data.                                                                                                   |
| `stripeEvents`                     | Webhook processing records keyed by Stripe event id for idempotent payment-status updates.                                                                                                                                                            |

## Decisions

- Money is stored in integer cents. This avoids floating-point rounding and matches future Stripe integration.
- Products store `availableFabricIds` directly because fabric choices are read with the product and do not currently need join metadata.
- Customization availability uses join rows because product-specific option compatibility is expected to grow. Available customization groups are derived from active option rows.
- Image references are structured `{ src, alt }` values. They currently point at local assets and can later point at managed storage without changing UI contracts.
- Stable slugs and option codes have indexes for storefront routing, seed references, and future configurator state.
- Active flags preserve catalog history without deleting records. Display order fields make merchandising deterministic.
- Saved designs store `ownerClerkUserId` for ownership checks, `productId` for product integrity, a human-readable `name`, the serialized configuration snapshot, server-derived `priceCents`, optional `previewImageReference`, and created/updated timestamps. They do not duplicate Clerk profile data or store passwords.
- Saved-design mutations validate configuration snapshots against active products, active fabrics, product option availability, compatibility metadata, and personalization limits. Prices are recalculated in Convex rather than accepted from clients.
- Cart mutations validate the same product, fabric, option availability, compatibility metadata, personalization, and pricing rules before adding, updating, merging, or checking out configured suit snapshots. Client-submitted totals are ignored.
- Order creation validates the authenticated Convex cart again before writing order records. Checkout Session line items are built from this server-priced order snapshot, never from browser totals.
- Stripe webhooks are verified in the Next.js route with `STRIPE_WEBHOOK_SECRET`, then processed by Convex with `STRIPE_WEBHOOK_PROCESSING_SECRET`. The `stripeEvents` table records processed event ids so repeated Stripe deliveries do not double-update orders.
- Paid webhook events update `orders.paymentStatus`, attach Stripe PaymentIntent IDs when available, and clear the authenticated cart. Checkout success redirects alone do not clear carts.
- Convex authentication uses Clerk's Frontend API URL through `convex/auth.config.ts`; set `CLERK_FRONTEND_API_URL` in the Convex dashboard before deploying authenticated functions.

## Seed workflow

1. Copy `.env.example` to `.env.local`.
2. Run `pnpm convex:dev` and connect or create a Convex development deployment.
3. In another terminal, run `pnpm convex:seed`.
4. Run `pnpm dev`.

The seed mutation is internal and idempotent for local development: it clears the six storefront catalog tables and recreates the realistic sample catalog. It does not clear saved user designs. Do not run it against production data.
