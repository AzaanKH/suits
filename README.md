# Arden Tailoring

The application is a Next.js App Router storefront for a custom suit ecommerce brand. Product, category, fabric, and customization data are served by Convex. The previous frontend prototype remains available in Git history.

## Setup

Install dependencies, connect a Convex development deployment, seed it, and start the application:

```bash
pnpm install
cp .env.example .env.local
pnpm convex:dev
```

In another terminal:

```bash
pnpm convex:seed
pnpm dev
```

`pnpm convex:dev` creates or updates the required Convex values in `.env.local`. See [`docs/convex-schema.md`](docs/convex-schema.md) for schema decisions and seed behavior.

## Environment variables

Required now:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

Reserved for later authentication and checkout work:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

Clerk authentication, cart persistence, Stripe Checkout, and 3D configuration are intentionally not wired yet.

## Scripts

| Command             | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Start the local Next.js development server          |
| `pnpm build`        | Create a production build                           |
| `pnpm convex:dev`   | Connect and sync a Convex development deployment    |
| `pnpm convex:seed`  | Replace local Convex storefront data with seed data |
| `pnpm start`        | Start the production Next.js server                 |
| `pnpm lint`         | Run ESLint                                          |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting files  |
| `pnpm test`         | Run Vitest unit and component tests                 |
| `pnpm test:e2e`     | Run Playwright end-to-end tests                     |
| `pnpm format`       | Format the project with Prettier                    |
| `pnpm format:check` | Check formatting with Prettier                      |
