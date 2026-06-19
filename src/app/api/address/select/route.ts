import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { addressSelectionSchema } from "@/features/checkout/schema";

export async function POST(request: Request) {
  const { getToken } = await auth.protect();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const processingSecret = process.env.USPS_VALIDATION_PROCESSING_SECRET;

  if (!convexUrl || !processingSecret) {
    return NextResponse.json(
      { error: "Address selection is not configured." },
      { status: 503 },
    );
  }

  const parsed = addressSelectionSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a validated address." },
      { status: 400 },
    );
  }

  const convexToken = await getToken({ template: "convex" });

  if (!convexToken) {
    return NextResponse.json(
      { error: "Authentication is not configured for checkout." },
      { status: 401 },
    );
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);
    const result = await convex.mutation(api.orders.selectValidatedAddress, {
      processingSecret,
      validationId: parsed.data.validationId as Id<"addressValidations">,
      selection: parsed.data.selection,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? getConvexErrorMessage(error)
            : "Unable to save the selected address.",
      },
      { status: 400 },
    );
  }
}

function getConvexErrorMessage(error: Error) {
  return (
    error.message.match(/Uncaught ConvexError: (.*)/)?.[1] ?? error.message
  );
}
