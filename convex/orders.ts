import { ConvexError, v } from "convex/values";

import { requireAuthenticatedClerkUserId } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { clearCartForOwner, getCheckoutCartForUser } from "./carts";
import { getAddressFingerprint } from "../src/lib/address-fingerprint";
import { getUsStateSalesTaxDetails } from "../src/lib/sales-tax";

const shippingAddressValidator = v.object({
  fullName: v.string(),
  email: v.string(),
  phone: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  postalCode: v.string(),
  country: v.string(),
});

const addressValidationMessageValidator = v.object({
  code: v.string(),
  text: v.string(),
});

const addressIndicatorsValidator = v.object({
  deliveryPoint: v.optional(v.string()),
  carrierRoute: v.optional(v.string()),
  cmra: v.optional(v.string()),
  business: v.optional(v.string()),
  centralDeliveryPoint: v.optional(v.string()),
  vacant: v.optional(v.string()),
});

const addressValidationBehaviorValidator = v.union(
  v.literal("accept"),
  v.literal("add_unit"),
  v.literal("verify_unit"),
  v.literal("confirm"),
);

const addressSelectionValidator = v.union(
  v.literal("entered"),
  v.literal("usps"),
);

const webhookPaymentStatusValidator = v.union(
  v.literal("paid"),
  v.literal("unpaid"),
  v.literal("failed"),
  v.literal("refunded"),
);

const webhookSecretArgs = {
  processingSecret: v.string(),
  stripeEventId: v.string(),
  eventType: v.string(),
};

export const createPendingFromCart = mutation({
  args: {
    shippingAddress: v.optional(shippingAddressValidator),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, { shippingAddress, currency }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await getCheckoutCartForUser(ctx, ownerClerkUserId, true);
    const normalizedCurrency = normalizeCurrency(currency ?? "usd");
    const now = Date.now();
    const subtotalCents = cart.lineItems.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0,
    );
    const normalizedShippingAddress = shippingAddress
      ? normalizeShippingAddress(shippingAddress)
      : undefined;
    const checkoutAttemptKey = await createCheckoutAttemptKey(cart.lineItems);
    const itemCount = cart.lineItems.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const reusableOrder = await getReusableCheckoutAttempt(
      ctx,
      ownerClerkUserId,
      checkoutAttemptKey,
    );

    if (reusableOrder) {
      await ctx.db.patch(reusableOrder._id, {
        ...(normalizedShippingAddress
          ? { shippingAddress: normalizedShippingAddress }
          : {}),
        subtotalCents,
        currency: normalizedCurrency,
        itemCount,
        updatedAt: now,
      });

      return {
        orderId: reusableOrder._id,
        checkoutAttemptKey,
        stripeCheckoutSessionId: reusableOrder.stripeCheckoutSessionId,
        subtotalCents,
        currency: normalizedCurrency,
        itemCount,
        lineItems: cart.lineItems,
      };
    }

    const orderId = await ctx.db.insert("orders", {
      ownerClerkUserId,
      checkoutAttemptKey,
      ...(normalizedShippingAddress
        ? { shippingAddress: normalizedShippingAddress }
        : {}),
      subtotalCents,
      currency: normalizedCurrency,
      paymentStatus: "checkout_pending",
      fulfillmentStatus: "unfulfilled",
      itemCount,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      cart.lineItems.map(async (item) => {
        await ctx.db.insert("orderItems", {
          orderId,
          ownerClerkUserId,
          lineId: item.lineId,
          productId: item.productId,
          productSlug: item.productSlug,
          productName: item.productName,
          previewImageReference: item.previewImageReference,
          configurationSnapshot: item.configuration,
          selectionsSnapshot: item.selections,
          personalizationSnapshot: item.personalization,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          lineSubtotalCents: item.unitPriceCents * item.quantity,
          fitMethod: item.fitMethod,
          jacketSize: item.jacketSize,
          trouserSize: item.trouserSize,
          trouserWaist: item.trouserWaist,
          trouserInseam: item.trouserInseam,
          fitPreference: item.fitPreference,
          measurementProfileId: item.measurementProfileId,
          measurementProfileName: item.measurementProfileName,
          measurementAppointmentRequired: item.measurementAppointmentRequired,
          createdAt: now,
        });
      }),
    );

    return {
      orderId,
      checkoutAttemptKey,
      subtotalCents,
      currency: normalizedCurrency,
      itemCount,
      lineItems: cart.lineItems,
    };
  },
});

export const recordAddressValidation = mutation({
  args: {
    processingSecret: v.string(),
    orderId: v.id("orders"),
    enteredAddress: shippingAddressValidator,
    standardizedAddress: v.optional(shippingAddressValidator),
    dpvConfirmation: v.optional(v.string()),
    corrections: v.array(addressValidationMessageValidator),
    warnings: v.array(addressValidationMessageValidator),
    indicators: addressIndicatorsValidator,
    addressChanged: v.boolean(),
    behavior: addressValidationBehaviorValidator,
  },
  handler: async (ctx, args) => {
    requireAddressValidationProcessingSecret(args.processingSecret);
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const order = await requireOwnedOrder(ctx, args.orderId, ownerClerkUserId);

    if (!["checkout_pending", "unpaid"].includes(order.paymentStatus)) {
      throw new ConvexError("Address can no longer be changed for this order.");
    }

    const now = Date.now();
    const enteredAddress = normalizeShippingAddress(args.enteredAddress);
    const standardizedAddress = args.standardizedAddress
      ? normalizeShippingAddress(args.standardizedAddress)
      : undefined;

    return await ctx.db.insert("addressValidations", {
      ownerClerkUserId,
      orderId: order._id,
      enteredAddress,
      ...(standardizedAddress ? { standardizedAddress } : {}),
      ...(args.dpvConfirmation
        ? { dpvConfirmation: normalizeIndicator(args.dpvConfirmation) }
        : {}),
      corrections: normalizeValidationMessages(args.corrections),
      warnings: normalizeValidationMessages(args.warnings),
      indicators: normalizeAddressIndicators(args.indicators),
      addressChanged: args.addressChanged,
      behavior: args.behavior,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const selectValidatedAddress = mutation({
  args: {
    processingSecret: v.string(),
    validationId: v.id("addressValidations"),
    selection: addressSelectionValidator,
  },
  handler: async (ctx, { processingSecret, validationId, selection }) => {
    requireAddressValidationProcessingSecret(processingSecret);
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const validation = await ctx.db.get(validationId);

    if (!validation || validation.ownerClerkUserId !== ownerClerkUserId) {
      throw new ConvexError("Address validation not found.");
    }

    const order = await requireOwnedOrder(
      ctx,
      validation.orderId,
      ownerClerkUserId,
    );

    if (!["checkout_pending", "unpaid"].includes(order.paymentStatus)) {
      throw new ConvexError("Address can no longer be changed for this order.");
    }

    if (selection === "usps" && !validation.standardizedAddress) {
      throw new ConvexError("USPS did not return a standardized address.");
    }

    if (validation.behavior === "add_unit") {
      throw new ConvexError(
        "Add an apartment or unit number before continuing.",
      );
    }

    const selectedAddress =
      selection === "usps"
        ? validation.standardizedAddress!
        : validation.enteredAddress;
    const now = Date.now();

    await ctx.db.patch(validation._id, {
      selection,
      selectedAddress,
      updatedAt: now,
    });
    await ctx.db.patch(order._id, {
      shippingAddress: selectedAddress,
      enteredShippingAddress: validation.enteredAddress,
      addressValidationId: validation._id,
      addressSelection: selection,
      updatedAt: now,
    });

    const addressFingerprint = getAddressFingerprint(selectedAddress);
    const existingAddress = await ctx.db
      .query("customerAddresses")
      .withIndex("by_owner_fingerprint", (q) =>
        q
          .eq("ownerClerkUserId", ownerClerkUserId)
          .eq("addressFingerprint", addressFingerprint),
      )
      .unique();
    const savedAddress = {
      address: selectedAddress,
      enteredAddress: validation.enteredAddress,
      ...(validation.standardizedAddress
        ? { standardizedAddress: validation.standardizedAddress }
        : {}),
      validationId: validation._id,
      ...(validation.dpvConfirmation
        ? { dpvConfirmation: validation.dpvConfirmation }
        : {}),
      indicators: validation.indicators,
      selection,
      lastUsedAt: now,
      updatedAt: now,
    };

    if (existingAddress) {
      await ctx.db.patch(existingAddress._id, savedAddress);
    } else {
      await ctx.db.insert("customerAddresses", {
        ownerClerkUserId,
        addressFingerprint,
        ...savedAddress,
        createdAt: now,
      });
    }

    return { orderId: order._id, shippingAddress: selectedAddress };
  },
});

export const attachCheckoutSession = mutation({
  args: {
    orderId: v.id("orders"),
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    replaceExisting: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    {
      orderId,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      replaceExisting = false,
    },
  ) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const order = await requireOwnedOrder(ctx, orderId, ownerClerkUserId);
    const hasDifferentCheckoutSession =
      order.stripeCheckoutSessionId &&
      order.stripeCheckoutSessionId !== stripeCheckoutSessionId;

    if (
      hasDifferentCheckoutSession &&
      (!replaceExisting ||
        !["checkout_pending", "unpaid"].includes(order.paymentStatus))
    ) {
      throw new ConvexError("Order already has a Checkout Session.");
    }

    await assertStripeIdsAvailable(ctx, order._id, {
      checkoutSessionId: stripeCheckoutSessionId,
      paymentIntentId: stripePaymentIntentId,
    });

    await ctx.db.patch(order._id, {
      stripeCheckoutSessionId,
      ...(stripePaymentIntentId
        ? { stripePaymentIntentId }
        : replaceExisting && hasDifferentCheckoutSession
          ? { stripePaymentIntentId: undefined }
          : {}),
      updatedAt: Date.now(),
    });
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);

    return await ctx.db
      .query("orders")
      .withIndex("by_owner_created_at", (q) =>
        q.eq("ownerClerkUserId", ownerClerkUserId),
      )
      .order("desc")
      .take(50);
  },
});

export const savedAddresses = query({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const savedAddresses = await ctx.db
      .query("customerAddresses")
      .withIndex("by_owner_updated_at", (q) =>
        q.eq("ownerClerkUserId", ownerClerkUserId),
      )
      .order("desc")
      .take(10);

    return savedAddresses.map((savedAddress) => savedAddress.address);
  },
});

export const detail = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, { orderId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const order = await requireOwnedOrder(ctx, orderId, ownerClerkUserId);
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    return { order, items };
  },
});

export const byCheckoutSessionForCurrentUser = query({
  args: {
    stripeCheckoutSessionId: v.string(),
  },
  handler: async (ctx, { stripeCheckoutSessionId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const order = await getOrderByCheckoutSession(ctx, stripeCheckoutSessionId);

    if (!order || order.ownerClerkUserId !== ownerClerkUserId) {
      return null;
    }

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    return { order, items };
  },
});

export const recordCheckoutSessionStatus = mutation({
  args: {
    ...webhookSecretArgs,
    checkoutSessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
    paymentStatus: webhookPaymentStatusValidator,
    orderId: v.optional(v.id("orders")),
    stripeSubtotalCents: v.optional(v.number()),
    stripeTaxCents: v.optional(v.number()),
    stripeTotalCents: v.optional(v.number()),
    shippingAddress: v.optional(shippingAddressValidator),
  },
  handler: async (ctx, args) => {
    requireWebhookProcessingSecret(args.processingSecret);

    const duplicate = await getStripeEvent(ctx, args.stripeEventId);
    if (duplicate) {
      return { status: "duplicate" as const, orderId: duplicate.orderId };
    }

    const now = Date.now();
    const order = await findWebhookOrder(ctx, {
      orderId: args.orderId,
      checkoutSessionId: args.checkoutSessionId,
      paymentIntentId: args.paymentIntentId,
    });

    if (!order) {
      await insertStripeEvent(ctx, {
        stripeEventId: args.stripeEventId,
        eventType: args.eventType,
        stripeObjectId: args.checkoutSessionId,
        processingStatus: "ignored",
        errorMessage: "Order not found for Stripe Checkout Session.",
        now,
      });

      return { status: "ignored" as const };
    }

    const paymentStatus = toOrderPaymentStatus(args.paymentStatus);
    await assertStripeIdsAvailable(ctx, order._id, {
      checkoutSessionId: args.checkoutSessionId,
      paymentIntentId: args.paymentIntentId,
    });

    await ctx.db.patch(order._id, {
      stripeCheckoutSessionId:
        order.stripeCheckoutSessionId ?? args.checkoutSessionId,
      ...(args.paymentIntentId
        ? { stripePaymentIntentId: args.paymentIntentId }
        : {}),
      ...(args.shippingAddress
        ? order.addressValidationId
          ? {}
          : { shippingAddress: normalizeShippingAddress(args.shippingAddress) }
        : {}),
      ...(args.stripeSubtotalCents !== undefined
        ? { subtotalCents: args.stripeSubtotalCents }
        : {}),
      ...(args.stripeTaxCents !== undefined
        ? { taxCents: args.stripeTaxCents }
        : {}),
      ...(args.stripeTotalCents !== undefined
        ? { totalCents: args.stripeTotalCents }
        : {}),
      ...taxJurisdictionPatch(args.shippingAddress),
      paymentStatus,
      ...(paymentStatus === "paid" ? { paymentConfirmedAt: now } : {}),
      updatedAt: now,
    });

    if (paymentStatus === "paid") {
      await clearCartForOwner(ctx, order.ownerClerkUserId);
    }

    await insertStripeEvent(ctx, {
      stripeEventId: args.stripeEventId,
      eventType: args.eventType,
      stripeObjectId: args.checkoutSessionId,
      orderId: order._id,
      processingStatus: "processed",
      now,
    });

    return { status: "processed" as const, orderId: order._id };
  },
});

export const recordPaymentIntentStatus = mutation({
  args: {
    ...webhookSecretArgs,
    paymentIntentId: v.string(),
    paymentStatus: webhookPaymentStatusValidator,
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    requireWebhookProcessingSecret(args.processingSecret);

    const duplicate = await getStripeEvent(ctx, args.stripeEventId);
    if (duplicate) {
      return { status: "duplicate" as const, orderId: duplicate.orderId };
    }

    const now = Date.now();
    const order = await findWebhookOrder(ctx, {
      orderId: args.orderId,
      paymentIntentId: args.paymentIntentId,
    });

    if (!order) {
      await insertStripeEvent(ctx, {
        stripeEventId: args.stripeEventId,
        eventType: args.eventType,
        stripeObjectId: args.paymentIntentId,
        processingStatus: "ignored",
        errorMessage: "Order not found for Stripe PaymentIntent.",
        now,
      });

      return { status: "ignored" as const };
    }

    const paymentStatus = toOrderPaymentStatus(args.paymentStatus);
    await assertStripeIdsAvailable(ctx, order._id, {
      paymentIntentId: args.paymentIntentId,
    });

    await ctx.db.patch(order._id, {
      stripePaymentIntentId: args.paymentIntentId,
      paymentStatus,
      ...(paymentStatus === "paid" ? { paymentConfirmedAt: now } : {}),
      updatedAt: now,
    });

    if (paymentStatus === "paid") {
      await clearCartForOwner(ctx, order.ownerClerkUserId);
    }

    await insertStripeEvent(ctx, {
      stripeEventId: args.stripeEventId,
      eventType: args.eventType,
      stripeObjectId: args.paymentIntentId,
      orderId: order._id,
      processingStatus: "processed",
      now,
    });

    return { status: "processed" as const, orderId: order._id };
  },
});

async function requireOwnedOrder(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"orders">,
  ownerClerkUserId: string,
) {
  const order = await ctx.db.get(orderId);

  if (!order || order.ownerClerkUserId !== ownerClerkUserId) {
    throw new ConvexError("Order not found.");
  }

  return order;
}

async function getReusableCheckoutAttempt(
  ctx: QueryCtx | MutationCtx,
  ownerClerkUserId: string,
  checkoutAttemptKey: string,
) {
  const attempts = await ctx.db
    .query("orders")
    .withIndex("by_owner_checkout_attempt_key", (q) =>
      q
        .eq("ownerClerkUserId", ownerClerkUserId)
        .eq("checkoutAttemptKey", checkoutAttemptKey),
    )
    .order("desc")
    .collect();

  return (
    attempts.find((order) =>
      ["checkout_pending", "unpaid"].includes(order.paymentStatus),
    ) ?? null
  );
}

async function findWebhookOrder(
  ctx: QueryCtx | MutationCtx,
  {
    orderId,
    checkoutSessionId,
    paymentIntentId,
  }: {
    orderId?: Id<"orders">;
    checkoutSessionId?: string;
    paymentIntentId?: string;
  },
) {
  if (orderId) {
    const order = await ctx.db.get(orderId);

    if (order) {
      return order;
    }
  }

  if (checkoutSessionId) {
    const order = await getOrderByCheckoutSession(ctx, checkoutSessionId);

    if (order) {
      return order;
    }
  }

  if (paymentIntentId) {
    return await getOrderByPaymentIntent(ctx, paymentIntentId);
  }

  return null;
}

async function assertStripeIdsAvailable(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"orders">,
  {
    checkoutSessionId,
    paymentIntentId,
  }: {
    checkoutSessionId?: string;
    paymentIntentId?: string;
  },
) {
  if (checkoutSessionId) {
    const existingOrder = await getOrderByCheckoutSession(
      ctx,
      checkoutSessionId,
    );

    if (existingOrder && existingOrder._id !== orderId) {
      throw new ConvexError("Stripe Checkout Session is already attached.");
    }
  }

  if (paymentIntentId) {
    const existingOrder = await getOrderByPaymentIntent(ctx, paymentIntentId);

    if (existingOrder && existingOrder._id !== orderId) {
      throw new ConvexError("Stripe PaymentIntent is already attached.");
    }
  }
}

async function getOrderByCheckoutSession(
  ctx: QueryCtx | MutationCtx,
  stripeCheckoutSessionId: string,
) {
  return await ctx.db
    .query("orders")
    .withIndex("by_stripe_checkout_session", (q) =>
      q.eq("stripeCheckoutSessionId", stripeCheckoutSessionId),
    )
    .unique();
}

async function getOrderByPaymentIntent(
  ctx: QueryCtx | MutationCtx,
  stripePaymentIntentId: string,
) {
  return await ctx.db
    .query("orders")
    .withIndex("by_stripe_payment_intent", (q) =>
      q.eq("stripePaymentIntentId", stripePaymentIntentId),
    )
    .unique();
}

async function getStripeEvent(
  ctx: QueryCtx | MutationCtx,
  stripeEventId: string,
) {
  return await ctx.db
    .query("stripeEvents")
    .withIndex("by_stripe_event_id", (q) =>
      q.eq("stripeEventId", stripeEventId),
    )
    .unique();
}

async function insertStripeEvent(
  ctx: MutationCtx,
  {
    stripeEventId,
    eventType,
    stripeObjectId,
    orderId,
    processingStatus,
    errorMessage,
    now,
  }: {
    stripeEventId: string;
    eventType: string;
    stripeObjectId?: string;
    orderId?: Id<"orders">;
    processingStatus: "processed" | "ignored" | "failed";
    errorMessage?: string;
    now: number;
  },
) {
  await ctx.db.insert("stripeEvents", {
    stripeEventId,
    eventType,
    stripeObjectId,
    orderId,
    processingStatus,
    errorMessage,
    createdAt: now,
    updatedAt: now,
  });
}

function requireWebhookProcessingSecret(processingSecret: string) {
  const expectedSecret = process.env.STRIPE_WEBHOOK_PROCESSING_SECRET;

  if (!expectedSecret || processingSecret !== expectedSecret) {
    throw new ConvexError("Unauthorized webhook processing.");
  }
}

function requireAddressValidationProcessingSecret(processingSecret: string) {
  const expectedSecret = process.env.USPS_VALIDATION_PROCESSING_SECRET;

  if (!expectedSecret || processingSecret !== expectedSecret) {
    throw new ConvexError("Unauthorized address validation processing.");
  }
}

function normalizeCurrency(currency: string) {
  const normalizedCurrency = currency.trim().toLowerCase();

  if (normalizedCurrency !== "usd") {
    throw new ConvexError("Unsupported checkout currency.");
  }

  return normalizedCurrency;
}

async function createCheckoutAttemptKey(
  lineItems: Array<{
    lineId: string;
    productId: Id<"products">;
    unitPriceCents: number;
    quantity: number;
    fitMethod: "standard" | "made-to-measure";
    jacketSize?: string;
    trouserSize?: string;
    trouserWaist?: string;
    trouserInseam?: string;
    fitPreference?: "slim" | "classic" | "relaxed";
    measurementProfileId?: Id<"measurementProfiles">;
    measurementAppointmentRequired?: boolean;
  }>,
) {
  const snapshot = lineItems
    .map((item) => ({
      lineId: item.lineId,
      productId: item.productId,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      fitMethod: item.fitMethod,
      jacketSize: item.jacketSize ?? "",
      trouserSize: item.trouserSize ?? "",
      trouserWaist: item.trouserWaist ?? "",
      trouserInseam: item.trouserInseam ?? "",
      fitPreference: item.fitPreference ?? "",
      measurementProfileId: item.measurementProfileId ?? "",
      measurementAppointmentRequired: Boolean(
        item.measurementAppointmentRequired,
      ),
    }))
    .sort((left, right) => left.lineId.localeCompare(right.lineId));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(snapshot)),
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `cart_${hash}`;
}

function normalizeShippingAddress(
  shippingAddress: typeof shippingAddressValidator.type,
) {
  const country = normalizeText(shippingAddress.country, "Country", 2, 80);
  const state = normalizeText(shippingAddress.state, "State or region", 2, 80);
  const taxState = getUsStateSalesTaxDetails(state);

  if (!taxState) {
    throw new ConvexError("Enter a valid US state.");
  }

  return {
    fullName: normalizeText(shippingAddress.fullName, "Recipient name", 2, 80),
    email: normalizeText(shippingAddress.email, "Email", 3, 254).toLowerCase(),
    phone: normalizeText(shippingAddress.phone, "Phone", 7, 30),
    line1: normalizeText(shippingAddress.line1, "Address line 1", 3, 120),
    ...(shippingAddress.line2
      ? {
          line2: normalizeText(shippingAddress.line2, "Address line 2", 0, 120),
        }
      : {}),
    city: normalizeText(shippingAddress.city, "City", 2, 80),
    state: taxState.code,
    postalCode: normalizeText(shippingAddress.postalCode, "Postal code", 3, 20),
    country,
  };
}

function normalizeText(
  value: string,
  label: string,
  minLength: number,
  maxLength: number,
) {
  const trimmed = value.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new ConvexError(
      `${label} must be between ${minLength} and ${maxLength} characters.`,
    );
  }

  return trimmed;
}

function normalizeValidationMessages(
  messages: Array<{ code: string; text: string }>,
) {
  return messages
    .map((message) => ({
      code: message.code.trim().slice(0, 40),
      text: message.text.trim().slice(0, 300),
    }))
    .filter((message) => message.code || message.text)
    .slice(0, 20);
}

function normalizeAddressIndicators(indicators: {
  deliveryPoint?: string;
  carrierRoute?: string;
  cmra?: string;
  business?: string;
  centralDeliveryPoint?: string;
  vacant?: string;
}) {
  return Object.fromEntries(
    Object.entries(indicators)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([key, value]) => [key, normalizeIndicator(value)]),
  );
}

function normalizeIndicator(value: string) {
  return value.trim().toUpperCase().slice(0, 20);
}

function taxJurisdictionPatch(
  shippingAddress: typeof shippingAddressValidator.type | undefined,
) {
  if (!shippingAddress) {
    return {};
  }

  const taxState = getUsStateSalesTaxDetails(shippingAddress.state);

  return taxState
    ? {
        taxJurisdictionCode: taxState.code,
        taxJurisdictionName: taxState.name,
      }
    : {};
}

function toOrderPaymentStatus(
  paymentStatus: "paid" | "unpaid" | "failed" | "refunded",
) {
  if (paymentStatus === "paid") {
    return "paid";
  }

  if (paymentStatus === "refunded") {
    return "refunded";
  }

  if (paymentStatus === "failed") {
    return "failed";
  }

  return "unpaid";
}
