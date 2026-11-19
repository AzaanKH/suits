@AGENTS.md

# Arden Tailoring

Next.js App Router storefront for made-to-measure suits. Convex is the backend, Clerk handles auth, and Stripe Checkout Sessions handle payment, with USPS address validation. Setup and environment variables are in `README.md`.

## Running locally

- `pnpm dev` needs a Convex deployment: run `pnpm convex:dev` in another terminal. The customizer reads its catalog from Convex, so pages render skeletons without it.
- An empty catalog means the seed has not run: `pnpm convex:seed`. It replaces catalog tables only, never saved designs.
- Checkout needs `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Restart `pnpm dev` after changing `STRIPE_WEBHOOK_SECRET`.
- E2E (`pnpm test:e2e`) builds and starts a production server on 127.0.0.1:3000. After a Playwright upgrade, run `pnpm exec playwright install chromium`.

## Checks

Run before committing: `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check`. Vitest runs two projects: `convex/**/*.test.ts` in edge-runtime and `src/**/*.test.{ts,tsx}` in jsdom.

## Things that are not obvious from the code

- Product options are seed data in `convex/seedData.ts`, not code. Pricing and compatibility are enforced twice: client-side in `src/features/customizer/` and again server-side in `convex/cartValidation.ts`, which re-prices from the database. Use the `customizer-option` skill when adding or changing options.
- The customizer store (`src/store/customizer-store.ts`) is the single source of truth for a design. The 3D scenes only read it and never compute prices.
- 3D has two surfaces, the `/customize` preview panel and the full-screen `/studio` route, sharing `src/features/customizer/three-d/suit-model.tsx`. Mesh names drive both visibility and click-to-edit. Read `docs/3d-suit-configurator.md` before touching 3D code, and use the `suit-3d-assets` skill for asset changes.
- 3D binaries (`*.glb`, `*.blend`, `*.obj`, asset PNGs, model textures) are in Git LFS. Run `git lfs install` once per machine. Deploys must fetch LFS objects, or `public/models` ships pointer files and the 3D view breaks.
- The React Compiler lint (`react-hooks/immutability`) rejects mutating values returned from hooks. For three.js objects, mutate inside `traverse` callbacks or through `useThree((s) => s.get)()`.
- `convex/_generated` is committed. Regenerate it with `pnpm exec convex codegen` after changing Convex functions or the schema.
