import { ConvexError, v } from "convex/values";

import { requireAuthenticatedClerkUserId } from "./auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  configurationValidator,
  createCartLineId,
  type CartConfiguration,
  type ValidatedConfiguration,
  validateConfigurationSnapshot,
} from "./cartValidation";
import { requireOwnedProfile } from "./measurementProfiles";

const quantityValidator = v.number();
const guestCartItemValidator = v.object({
  configuration: configurationValidator,
  quantity: quantityValidator,
  measurementAppointmentRequired: v.optional(v.boolean()),
});

type CartLineItem = {
  lineId: string;
  productId: Id<"products">;
  productSlug: string;
  productName: string;
  previewImageReference?: {
    src: string;
    alt: string;
  };
  configuration: CartConfiguration;
  selections: ValidatedConfiguration["selections"];
  personalization: CartConfiguration["personalization"];
  unitPriceCents: number;
  quantity: number;
  measurementProfileId?: Id<"measurementProfiles">;
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
  createdAt: number;
  updatedAt: number;
};

export const previewLine = mutation({
  args: {
    configuration: configurationValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { configuration, quantity }) => {
    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const now = Date.now();

    return await buildLineItem(validated, normalizeQuantity(quantity), now);
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await getCart(ctx, ownerClerkUserId);

    return toCartResponse(cart);
  },
});

export const forCheckout = query({
  args: {
    requireMeasurements: v.optional(v.boolean()),
  },
  handler: async (ctx, { requireMeasurements }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await getCart(ctx, ownerClerkUserId);

    if (!cart || cart.lineItems.length === 0) {
      throw new ConvexError("Cart is empty.");
    }

    const canonicalLineItems = await Promise.all(
      cart.lineItems.map(async (lineItem) => {
        const validated = await validateConfigurationSnapshot(
          ctx,
          lineItem.configuration,
        );
        const measurementChoice = await validateMeasurementChoice(
          ctx,
          lineItem,
          ownerClerkUserId,
          Boolean(requireMeasurements),
        );

        const canonicalLine = await buildLineItem(
          validated,
          normalizeQuantity(lineItem.quantity),
          lineItem.createdAt,
          lineItem.updatedAt,
        );

        return {
          ...canonicalLine,
          ...measurementChoice,
        };
      }),
    );

    return toCartResponse({ ...cart, lineItems: canonicalLineItems });
  },
});

export const addLine = mutation({
  args: {
    configuration: configurationValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { configuration, quantity }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const now = Date.now();
    const nextLine = await buildLineItem(
      validated,
      normalizeQuantity(quantity),
      now,
    );
    const cart = await getOrCreateCart(ctx, ownerClerkUserId, now);

    await patchCartLines(ctx, cart, mergeLineItems(cart.lineItems, nextLine));

    return nextLine;
  },
});

export const updateLine = mutation({
  args: {
    lineId: v.string(),
    configuration: configurationValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { lineId, configuration, quantity }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await requireCart(ctx, ownerClerkUserId);
    const existingLine = cart.lineItems.find((item) => item.lineId === lineId);

    if (!existingLine) {
      throw new ConvexError("Cart item not found.");
    }

    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const now = Date.now();
    const nextLine = await buildLineItem(
      validated,
      normalizeQuantity(quantity),
      existingLine.createdAt,
      now,
    );
    const nextLineWithMeasurement = {
      ...nextLine,
      ...(existingLine.measurementProfileId
        ? {
            measurementProfileId: existingLine.measurementProfileId,
            measurementProfileName: existingLine.measurementProfileName,
          }
        : {}),
      ...(existingLine.measurementAppointmentRequired
        ? { measurementAppointmentRequired: true }
        : {}),
    };
    const remainingLines = cart.lineItems.filter(
      (item) => item.lineId !== lineId,
    );

    await patchCartLines(
      ctx,
      cart,
      mergeLineItems(remainingLines, nextLineWithMeasurement),
    );

    return nextLineWithMeasurement;
  },
});

export const updateQuantity = mutation({
  args: {
    lineId: v.string(),
    quantity: quantityValidator,
  },
  handler: async (ctx, { lineId, quantity }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await requireCart(ctx, ownerClerkUserId);
    const normalizedQuantity = normalizeQuantity(quantity);
    const now = Date.now();
    let found = false;
    const lineItems = cart.lineItems.map((item) => {
      if (item.lineId !== lineId) {
        return item;
      }

      found = true;
      return {
        ...item,
        quantity: normalizedQuantity,
        updatedAt: now,
      };
    });

    if (!found) {
      throw new ConvexError("Cart item not found.");
    }

    await patchCartLines(ctx, cart, lineItems);
  },
});

export const setLineMeasurementChoice = mutation({
  args: {
    lineId: v.string(),
    measurementProfileId: v.optional(v.id("measurementProfiles")),
    measurementAppointmentRequired: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { lineId, measurementProfileId, measurementAppointmentRequired },
  ) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await requireCart(ctx, ownerClerkUserId);
    const now = Date.now();
    let found = false;
    let profileName: string | undefined;

    if (measurementProfileId && measurementAppointmentRequired) {
      throw new ConvexError(
        "Choose a measurement profile or request an appointment, not both.",
      );
    }

    if (measurementProfileId) {
      const profile = await requireOwnedProfile(
        ctx,
        measurementProfileId,
        ownerClerkUserId,
      );
      profileName = profile.name;
    }

    const lineItems = cart.lineItems.map((item) => {
      if (item.lineId !== lineId) {
        return item;
      }

      found = true;

      const remainingItem = { ...item };
      delete remainingItem.measurementProfileId;
      delete remainingItem.measurementProfileName;
      delete remainingItem.measurementAppointmentRequired;

      return {
        ...remainingItem,
        ...(measurementProfileId
          ? { measurementProfileId, measurementProfileName: profileName }
          : {}),
        ...(measurementAppointmentRequired
          ? { measurementAppointmentRequired: true }
          : {}),
        updatedAt: now,
      };
    });

    if (!found) {
      throw new ConvexError("Cart item not found.");
    }

    await patchCartLines(ctx, cart, lineItems);
  },
});

export const removeLine = mutation({
  args: {
    lineId: v.string(),
  },
  handler: async (ctx, { lineId }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await requireCart(ctx, ownerClerkUserId);
    const lineItems = cart.lineItems.filter((item) => item.lineId !== lineId);

    if (lineItems.length === cart.lineItems.length) {
      throw new ConvexError("Cart item not found.");
    }

    await patchCartLines(ctx, cart, lineItems);
  },
});

export const mergeGuestCart = mutation({
  args: {
    items: v.array(guestCartItemValidator),
  },
  handler: async (ctx, { items }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const now = Date.now();
    const validatedLines = await Promise.all(
      items.map(async (item) => ({
          ...(await buildLineItem(
            await validateConfigurationSnapshot(ctx, item.configuration),
            normalizeQuantity(item.quantity),
            now,
          )),
          ...(item.measurementAppointmentRequired
            ? { measurementAppointmentRequired: true }
            : {}),
        })),
    );
    const cart = await getOrCreateCart(ctx, ownerClerkUserId, now);
    const lineItems = validatedLines.reduce(
      (currentLines, lineItem) => mergeLineItems(currentLines, lineItem),
      cart.lineItems,
    );

    await patchCartLines(ctx, cart, lineItems);

    return toCartResponse({ ...cart, lineItems });
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await getCart(ctx, ownerClerkUserId);

    if (!cart) {
      return;
    }

    await patchCartLines(ctx, cart, []);
  },
});

async function getCart(ctx: QueryCtx | MutationCtx, ownerClerkUserId: string) {
  return await ctx.db
    .query("carts")
    .withIndex("by_owner", (q) => q.eq("ownerClerkUserId", ownerClerkUserId))
    .unique();
}

async function requireCart(
  ctx: QueryCtx | MutationCtx,
  ownerClerkUserId: string,
) {
  const cart = await getCart(ctx, ownerClerkUserId);

  if (!cart) {
    throw new ConvexError("Cart not found.");
  }

  return cart;
}

async function getOrCreateCart(
  ctx: MutationCtx,
  ownerClerkUserId: string,
  now: number,
) {
  const existingCart = await getCart(ctx, ownerClerkUserId);

  if (existingCart) {
    return existingCart;
  }

  const cartId = await ctx.db.insert("carts", {
    ownerClerkUserId,
    lineItems: [],
    createdAt: now,
    updatedAt: now,
  });

  const cart = await ctx.db.get(cartId);

  if (!cart) {
    throw new ConvexError("Unable to create cart.");
  }

  return cart;
}

async function patchCartLines(
  ctx: MutationCtx,
  cart: Doc<"carts">,
  lineItems: CartLineItem[],
) {
  await ctx.db.patch(cart._id, {
    lineItems,
    updatedAt: Date.now(),
  });
}

async function buildLineItem(
  validated: ValidatedConfiguration,
  quantity: number,
  createdAt: number,
  updatedAt = createdAt,
): Promise<CartLineItem> {
  return {
    lineId: await createCartLineId(validated.selectionSignature),
    productId: validated.product._id,
    productSlug: validated.product.slug,
    productName: validated.product.name,
    previewImageReference: validated.previewImageReference,
    configuration: validated.configuration,
    selections: validated.selections,
    personalization: validated.personalization,
    unitPriceCents: validated.priceCents,
    quantity,
    createdAt,
    updatedAt,
  };
}

async function validateMeasurementChoice(
  ctx: QueryCtx,
  lineItem: CartLineItem,
  ownerClerkUserId: string,
  required: boolean,
) {
  if (lineItem.measurementAppointmentRequired) {
    return {
      measurementAppointmentRequired: true,
    };
  }

  if (lineItem.measurementProfileId) {
    const profile = await ctx.db.get(lineItem.measurementProfileId);

    if (profile?.ownerClerkUserId === ownerClerkUserId) {
      return {
        measurementProfileId: profile._id,
        measurementProfileName: profile.name,
      };
    }

    if (required) {
      throw new ConvexError(
        `${lineItem.productName} needs a valid measurement profile.`,
      );
    }
  }

  if (required) {
    throw new ConvexError(
      `${lineItem.productName} needs a measurement profile or appointment request.`,
    );
  }

  return {};
}

function mergeLineItems(
  lineItems: CartLineItem[],
  nextLine: CartLineItem,
): CartLineItem[] {
  const existingLine = lineItems.find(
    (lineItem) => lineItem.lineId === nextLine.lineId,
  );

  if (!existingLine) {
    return [
      ...lineItems,
      {
        ...nextLine,
        quantity: normalizeQuantity(nextLine.quantity),
      },
    ];
  }

  return lineItems.map((lineItem) =>
    lineItem.lineId === nextLine.lineId
      ? {
          ...nextLine,
          quantity: normalizeQuantity(existingLine.quantity + nextLine.quantity),
          createdAt: existingLine.createdAt,
          updatedAt: nextLine.updatedAt,
        }
      : lineItem,
  );
}

function toCartResponse(cart: Pick<Doc<"carts">, "lineItems"> | null) {
  const lineItems = cart?.lineItems ?? [];

  return {
    lineItems,
    itemCount: lineItems.reduce((total, item) => total + item.quantity, 0),
    subtotalCents: lineItems.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0,
    ),
  };
}

function normalizeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ConvexError("Quantity must be between 1 and 99.");
  }

  return quantity;
}
