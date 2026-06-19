import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { addressValidationRequestSchema } from "@/features/checkout/schema";
import { validateUspsAddress } from "@/lib/usps-addresses";

export async function POST(request: Request) {
  const { getToken } = await auth.protect();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const processingSecret = process.env.USPS_VALIDATION_PROCESSING_SECRET;

  if (
    !convexUrl ||
    !processingSecret ||
    !process.env.USPS_CLIENT_ID ||
    !process.env.USPS_CLIENT_SECRET
  ) {
    return NextResponse.json(
      { error: "USPS address validation is not configured." },
      { status: 503 },
    );
  }

  const parsed = addressValidationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Complete the shipping address before validating it.",
      },
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
    const result = await validateUspsAddress(parsed.data.shippingAddress);
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);
    const validationId = await convex.mutation(
      api.orders.recordAddressValidation,
      {
        processingSecret,
        orderId: parsed.data.orderId as Id<"orders">,
        enteredAddress: parsed.data.shippingAddress,
        ...result,
      },
    );

    return NextResponse.json({ validationId, ...result });
  } catch (error) {
    console.error("USPS address validation failed.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? getAddressValidationErrorMessage(error)
            : "USPS could not validate this address.",
      },
      { status: 422 },
    );
  }
}

function getAddressValidationErrorMessage(error: Error) {
  const convexError =
    error.message.match(/Uncaught ConvexError: (.*)/)?.[1] ?? error.message;

  if (/Unauthorized address validation processing/i.test(convexError)) {
    return "USPS validation processing is not configured in Convex.";
  }

  return convexError;
}
