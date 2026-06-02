# Suits

The application is a Next.js App Router project. The previous Create React App frontend and unfinished backend prototype remain available in Git history.

## Setup

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

No environment variables are required for the current scaffold. Copy `.env.example` to `.env.local` when service configuration is added.

## Scripts

| Command             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Start the local Next.js development server         |
| `pnpm build`        | Create a production build                          |
| `pnpm start`        | Start the production Next.js server                |
| `pnpm lint`         | Run ESLint                                         |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting files |
| `pnpm test`         | Run Vitest unit and component tests                |
| `pnpm test:e2e`     | Run Playwright end-to-end tests                    |
| `pnpm format`       | Format the project with Prettier                   |
| `pnpm format:check` | Check formatting with Prettier                     |
