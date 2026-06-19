# Arden Tailoring

The application is a Next.js App Router storefront for a custom suit ecommerce brand. Product, category, fabric, customization data, saved designs, orders, and address validation records are served by Convex. Clerk provides authentication, while Stripe Checkout Sessions power embedded Address and Payment Elements with USPS Addresses 3.0 validation before payment. The previous frontend prototype remains available in Git history.

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

## Clerk setup

Create a Clerk application, then add the following values to `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/account`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/account`

In the Clerk Dashboard, activate the Convex integration and copy the Frontend API URL. Add that value as `CLERK_FRONTEND_API_URL` in the Convex dashboard for each Convex deployment. Development URLs look like `https://verb-noun-00.clerk.accounts.dev`; production URLs use the configured Clerk domain.

After setting the Convex environment variable, run:

```bash
pnpm exec convex codegen
pnpm convex:dev
```

The app keeps browsing, product detail, customization, and cart review public. Clerk is required for `/account`, saving a configured design, and starting checkout.

## Stripe and USPS checkout setup

This storefront uses Stripe Address and Payment Elements backed by Checkout Sessions. USPS Addresses 3.0 standardizes and checks the shipping address before payment. Orders, saved customer addresses, and USPS validation results are stored in Convex.

Create a Stripe account, use test mode locally, and add:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_PROCESSING_SECRET`
- `STRIPE_AUTOMATIC_TAX_ENABLED=false` until Stripe Tax has a real shipping origin or head-office address
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

`STRIPE_WEBHOOK_PROCESSING_SECRET` is a shared server-side secret between the Next.js webhook route and Convex. Generate it with a cryptographically secure source:

```bash
openssl rand -base64 32
```

Or with Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Set the generated value in `.env.local` and in the Convex dashboard:

```bash
STRIPE_WEBHOOK_PROCESSING_SECRET="generated-secret-value"
```

```bash
pnpm exec convex env set STRIPE_WEBHOOK_PROCESSING_SECRET "generated-secret-value"
```

Create an application in the USPS Developer Portal with access to Addresses 3.0, then add:

- `USPS_CLIENT_ID`
- `USPS_CLIENT_SECRET`
- `USPS_API_ENV=test` for the USPS test environment, or omit it for production
- `USPS_VALIDATION_PROCESSING_SECRET`

Generate `USPS_VALIDATION_PROCESSING_SECRET` the same way as the Stripe processing secret, then set it in both environments:

```bash
pnpm exec convex env set USPS_VALIDATION_PROCESSING_SECRET "generated-secret-value"
```

Forward local webhooks with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`. Restart the Next.js dev server after changing `.env.local` so `/api/stripe/webhook` uses the current signature secret:

```bash
pnpm dev
```

Then sign in with Clerk, add a configured suit to the cart, validate and choose the shipping address, and complete payment with Stripe test card `4242 4242 4242 4242`, any future expiry date, and any CVC.

Successful payment redirects to `/checkout/success?session_id=...`. The cart is cleared only after `/api/stripe/webhook` verifies the Stripe signature and Convex records a paid order. Cancelled or abandoned Checkout Sessions keep the cart available.

## Environment variables

Required:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `CLERK_FRONTEND_API_URL` (set in Convex dashboard)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_PROCESSING_SECRET` (also set in Convex)
- `STRIPE_AUTOMATIC_TAX_ENABLED`
- `USPS_CLIENT_ID`
- `USPS_CLIENT_SECRET`
- `USPS_VALIDATION_PROCESSING_SECRET` (also set in Convex)

Optional:

- `USPS_API_ENV=test` for the USPS test environment; omit it for production

Do not store passwords in Convex. Saved design documents store the Clerk user id for ownership checks and design details only; Clerk profile fields remain in Clerk.

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
