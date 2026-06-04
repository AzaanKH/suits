import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/account",
  "/account/measurements(.*)",
  "/checkout(.*)",
  "/api/checkout",
]);
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const protectedProxy = clerkMiddleware(async (auth) => {
  await auth.protect();
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured || !isProtectedRoute(request)) {
    return NextResponse.next();
  }

  return protectedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
