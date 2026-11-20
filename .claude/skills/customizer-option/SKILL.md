---
name: customizer-option
description: Add, change, price, restrict, or remove a suit customization option (fabric, jacket style, lapel, buttons, pockets, trousers, extras) end to end — seed data, compatibility rules, server re-validation, 3D display, and tests. Use when a request touches what a customer can choose or what it costs.
---

# Customizer options

Options are **data**, not code. A new lapel or button is a seed entry; most of the work is making every layer agree on it.

## Where an option lives

| Layer              | File                                                | What to change                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog data       | `convex/seedData.ts`                                | The option entry: `code`, `groupCode`, `label`, `description`, `priceModifierCents`, `imageReference`, `displayOrder`, and optional `compatibilityMetadata.rules`. Then add the code to each product's option list (`houseOptionCodes`, `doubleBreastedOptionCodes`, and so on). |
| Client rules       | `src/features/customizer/compatibility.ts`          | Nothing, for normal `requires` or `excludes` rules. They are generic over the seed data.                                                                                                                                                                                         |
| Server rules       | `convex/cartValidation.ts`                          | Nothing for normal rules. It has its **own** `getUnavailableReason` and re-prices from the database. If you add a new rule _type_, change both copies.                                                                                                                           |
| Steps and groups   | `src/features/customizer/steps.ts`                  | Only for a new **group**: `CUSTOMIZER_GROUP_CODES`, `CUSTOMIZER_STEPS`, and `getGroupSelectionMode`.                                                                                                                                                                             |
| 3D                 | `src/features/customizer/three-d/suit-selection.ts` | Add the code to `SUPPORTED_CODES`. If it needs new geometry, follow the `suit-3d-assets` skill. Fabrics also need a `FABRIC_MATERIALS` entry for the swatch and scene color.                                                                                                     |
| Tailoring requests | `src/features/customizer/tailoring.ts`              | Only for unpriced, specification-only "Details" requests. These are a separate system from priced options.                                                                                                                                                                       |

Codes are stable IDs stored in saved designs, carts, and orders. **Never rename or reuse a code.** Retire it by removing it from product option lists and keep the entry, so old designs still render their summary.

## Rules

`compatibilityMetadata.rules` entries have this shape:

```ts
{ type: "requires" | "excludes", groupCode, optionCodes: [...], reason: "Customer-facing sentence." }
```

The `reason` is shown on the disabled option card, so write it for a customer.

## Steps

1. Edit `convex/seedData.ts`.
2. Run `pnpm convex:seed` against your **development** deployment. It wipes and recreates the catalog tables only.
3. Update `SUPPORTED_CODES` or `FABRIC_MATERIALS` if the option should appear in 3D.
4. Add tests:
   - `src/features/customizer/customizer.test.ts` for pricing and compatibility on the client.
   - `convex/products.test.ts` or `convex/carts.test.ts` for server re-pricing, so a crafted client cannot buy it at the wrong price.
   - `src/features/customizer/three-d/suit-selection.test.ts` for the 3D mapping.
5. Run `pnpm typecheck && pnpm lint && pnpm test`.
6. Check it in the browser at `/customize/house-navy-hopsack-suit` and `/studio/house-navy-hopsack-suit`: the card, the disabled state and its reason, the price change, and the 3D result.
