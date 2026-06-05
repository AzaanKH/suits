import { ConvexError, v } from "convex/values";

import { requireAuthenticatedClerkUserId } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { clearCartForOwner, getCheckoutCartForUser } from "./carts";

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

const webhookPaymentStatusValidator = v.union(
  v.literal("paid"),
  v.literal("unpaid"),
  v.literal("failed"),
);

const webhookSecretArgs = {
  processingSecret: v.string(),
  stripeEventId: v.string(),
  eventType: v.string(),
};

export const createPendingFromCart = mutation({
  args: {
    shippingAddress: shippingAddressValidator,
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
    const itemCount = cart.lineItems.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const orderId = await ctx.db.insert("orders", {
      ownerClerkUserId,
      shippingAddress: normalizeShippingAddress(shippingAddress),
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
      subtotalCents,
      currency: normalizedCurrency,
      itemCount,
      lineItems: cart.lineItems,
    };
  },
});

export const attachCheckoutSession = mutation({
  args: {
    orderId: v.id("orders"),
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { orderId, stripeCheckoutSessionId, stripePaymentIntentId },
  ) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const order = await requireOwnedOrder(ctx, orderId, ownerClerkUserId);

    if (
      order.stripeCheckoutSessionId &&
      order.stripeCheckoutSessionId !== stripeCheckoutSessionId
    ) {
      throw new ConvexError("Order already has a Checkout Session.");
    }

    await ctx.db.patch(order._id, {
      stripeCheckoutSessionId,
      ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
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

    return order;
  },
});

export const recordCheckoutSessionStatus = mutation({
  args: {
    ...webhookSecretArgs,
    checkoutSessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
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
    await ctx.db.patch(order._id, {
      stripeCheckoutSessionId:
        order.stripeCheckoutSessionId ?? args.checkoutSessionId,
      ...(args.paymentIntentId
        ? { stripePaymentIntentId: args.paymentIntentId }
        : {}),
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

function normalizeCurrency(currency: string) {
  const normalizedCurrency = currency.trim().toLowerCase();

  if (normalizedCurrency !== "usd") {
    throw new ConvexError("Unsupported checkout currency.");
  }

  return normalizedCurrency;
}

function normalizeShippingAddress(
  shippingAddress: typeof shippingAddressValidator.type,
) {
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
    state: normalizeText(shippingAddress.state, "State or region", 2, 80),
    postalCode: normalizeText(shippingAddress.postalCode, "Postal code", 3, 20),
    country: normalizeText(shippingAddress.country, "Country", 2, 80),
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

function toOrderPaymentStatus(paymentStatus: "paid" | "unpaid" | "failed") {
  if (paymentStatus === "paid") {
    return "paid";
  }

  if (paymentStatus === "failed") {
    return "failed";
  }

  return "unpaid";
}
