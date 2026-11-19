---
name: convex-change
description: Change the Convex backend safely — schema fields, queries, mutations, internal functions, auth checks, seed data — with codegen and convex-test coverage. Use when editing anything under convex/, adding a table or index, or when a Convex type error, missing generated API, or failing convex test shows up.
---

# Convex changes

## Before editing

- Read `docs/convex-schema.md` for why tables and indexes are shaped the way they are.
- Ownership checks use the Clerk user id from `requireAuthenticatedClerkUserId(ctx)` (or `getAuthenticatedClerkUserId` for optional auth) in `convex/auth.ts`. Every query or mutation that touches user data (saved designs, carts, measurement profiles, orders) must check that the document's owner matches. Copy the pattern from `convex/savedDesigns.ts` rather than inventing one.
- Webhook and USPS processing functions are `internal` and are called with shared secrets (`STRIPE_WEBHOOK_PROCESSING_SECRET`, `USPS_VALIDATION_PROCESSING_SECRET`). Never expose them as public functions.

## Schema changes

1. Edit `convex/schema.ts`. Deployed data must still validate. Add new fields as `v.optional(...)` unless you also write a migration.
2. Keep stored configurations versioned. `configuration.version` and the optional `tailoring` field exist so old saved designs stay readable.
3. Regenerate types with `pnpm exec convex codegen` (or keep `pnpm convex:dev` running). `convex/_generated` is committed. Include it in the same commit.

## Tests

Convex tests run in the `convex` Vitest project (edge-runtime) with `convex-test`:

```ts
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";

const t = convexTest(schema, modules).withIdentity({
  subject: "user_123",
  issuer: "https://example.clerk.accounts.dev",
});
```

For every new public function, cover:

- the happy path,
- an unauthenticated call,
- a different user trying to read or change someone else's document,
- invalid input that the validator or business rules must reject.

Run `pnpm vitest run --project convex`, then the full `pnpm test`.

## Seed

`pnpm convex:seed` runs `internal.seed.seed`. It clears and recreates the six catalog tables and leaves user data alone. Only run it against development deployments.
