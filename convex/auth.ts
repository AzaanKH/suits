import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

type ConvexAuthCtx = Pick<QueryCtx | MutationCtx | ActionCtx, "auth">;

export async function getAuthenticatedClerkUserId(ctx: ConvexAuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  return identity?.subject ?? null;
}

export async function requireAuthenticatedClerkUserId(ctx: ConvexAuthCtx) {
  const clerkUserId = await getAuthenticatedClerkUserId(ctx);

  if (!clerkUserId) {
    throw new Error("Authentication required.");
  }

  return clerkUserId;
}
