import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

export async function getAuthenticatedConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
  }

  const { getToken } = await auth.protect();
  const convexToken = await getToken({ template: "convex" });

  if (!convexToken) {
    throw new Error("Convex auth token is required.");
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(convexToken);

  return convex;
}
