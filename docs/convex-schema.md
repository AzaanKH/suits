# Convex storefront schema

The storefront uses six tables:

| Table                              | Purpose                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `products`                         | Sellable suit foundations, pricing, copy, images, status, ordering, and fabric availability.                          |
| `categories`                       | Active catalog filters such as business, occasion, and seasonal.                                                      |
| `fabrics`                          | Reusable cloth records with mill, composition, weight, seasonality, and descriptive copy.                             |
| `customizationGroups`              | Ordered configurator sections such as jacket, trouser, lining, and finishing.                                         |
| `customizationOptions`             | Stable option codes, price modifiers in integer cents, presentation data, and open-ended compatibility metadata.      |
| `productCustomizationAvailability` | Explicit product-to-option join rows. Each row also stores the option's group ID for efficient product/group lookups. |

## Decisions

- Money is stored in integer cents. This avoids floating-point rounding and matches future Stripe integration.
- Products store `availableFabricIds` directly because fabric choices are read with the product and do not currently need join metadata.
- Customization availability uses join rows because product-specific option compatibility is expected to grow. Available customization groups are derived from active option rows.
- Image references are structured `{ src, alt }` values. They currently point at local assets and can later point at managed storage without changing UI contracts.
- Stable slugs and option codes have indexes for storefront routing, seed references, and future configurator state.
- Active flags preserve catalog history without deleting records. Display order fields make merchandising deterministic.

## Seed workflow

1. Copy `.env.example` to `.env.local`.
2. Run `pnpm convex:dev` and connect or create a Convex development deployment.
3. In another terminal, run `pnpm convex:seed`.
4. Run `pnpm dev`.

The seed mutation is internal and idempotent for local development: it clears the six storefront tables and recreates the realistic sample catalog. Do not run it against production data.
