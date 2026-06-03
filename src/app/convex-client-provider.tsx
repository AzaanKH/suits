"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 text-center">
        <div>
          <h1 className="text-ink font-serif text-5xl leading-none">
            Storefront setup required.
          </h1>
          <p className="text-muted-foreground mt-5 text-sm leading-6">
            Set <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code>,
            then run the Convex development server and seed workflow.
          </p>
        </div>
      </main>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
