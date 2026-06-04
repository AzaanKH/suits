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

const quantityValidator = v.number();
const guestCartItemValidator = v.object({
  configuration: configurationValidator,
  quantity: quantityValidator,
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
  args: {},
  handler: async (ctx) => {
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

        return await buildLineItem(
          validated,
          normalizeQuantity(lineItem.quantity),
          lineItem.createdAt,
          lineItem.updatedAt,
        );
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
    const remainingLines = cart.lineItems.filter(
      (item) => item.lineId !== lineId,
    );

    await patchCartLines(ctx, cart, mergeLineItems(remainingLines, nextLine));

    return nextLine;
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
      items.map(async (item) =>
        buildLineItem(
          await validateConfigurationSnapshot(ctx, item.configuration),
          normalizeQuantity(item.quantity),
          now,
        ),
      ),
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
