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
const fitPreferenceValidator = v.union(
  v.literal("slim"),
  v.literal("classic"),
  v.literal("relaxed"),
);
const standardFitSelectionValidator = v.object({
  fitMethod: v.literal("standard"),
  jacketSize: v.string(),
  trouserSize: v.optional(v.string()),
  trouserWaist: v.optional(v.string()),
  trouserInseam: v.optional(v.string()),
  fitPreference: fitPreferenceValidator,
});
const madeToMeasureFitSelectionValidator = v.object({
  fitMethod: v.literal("made-to-measure"),
  measurementProfileId: v.optional(v.id("measurementProfiles")),
  measurementAppointmentRequired: v.optional(v.boolean()),
});
const fitSelectionValidator = v.union(
  standardFitSelectionValidator,
  madeToMeasureFitSelectionValidator,
);
const guestCartItemValidator = v.object({
  configuration: configurationValidator,
  quantity: quantityValidator,
  fitSelection: standardFitSelectionValidator,
});

type FitSelection =
  | {
      fitMethod: "standard";
      jacketSize: string;
      trouserSize?: string;
      trouserWaist?: string;
      trouserInseam?: string;
      fitPreference: "slim" | "classic" | "relaxed";
    }
  | {
      fitMethod: "made-to-measure";
      measurementProfileId?: Id<"measurementProfiles">;
      measurementAppointmentRequired?: boolean;
    };

type CartFitDetails =
  | {
      fitMethod: "standard";
      jacketSize: string;
      trouserSize?: string;
      trouserWaist?: string;
      trouserInseam?: string;
      fitPreference: "slim" | "classic" | "relaxed";
    }
  | {
      fitMethod: "made-to-measure";
      measurementProfileId?: Id<"measurementProfiles">;
      measurementProfileName?: string;
      measurementAppointmentRequired?: boolean;
    };

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
  fitMethod: CartFitDetails["fitMethod"];
  jacketSize?: string;
  trouserSize?: string;
  trouserWaist?: string;
  trouserInseam?: string;
  fitPreference?: "slim" | "classic" | "relaxed";
  measurementProfileId?: Id<"measurementProfiles">;
  measurementProfileName?: string;
  measurementAppointmentRequired?: boolean;
  createdAt: number;
  updatedAt: number;
};

export const previewLine = mutation({
  args: {
    configuration: configurationValidator,
    fitSelection: fitSelectionValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { configuration, fitSelection, quantity }) => {
    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const now = Date.now();
    const fitDetails = await validateFitSelection(ctx, fitSelection);

    return await buildLineItem(
      validated,
      fitDetails,
      normalizeQuantity(quantity),
      now,
    );
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
        const fitDetails = await validateCartLineFit(
          ctx,
          lineItem,
          ownerClerkUserId,
          Boolean(requireMeasurements),
        );

        const canonicalLine = await buildLineItem(
          validated,
          fitDetails,
          normalizeQuantity(lineItem.quantity),
          lineItem.createdAt,
          lineItem.updatedAt,
        );

        return canonicalLine;
      }),
    );

    return toCartResponse({ ...cart, lineItems: canonicalLineItems });
  },
});

export const addLine = mutation({
  args: {
    configuration: configurationValidator,
    fitSelection: fitSelectionValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { configuration, fitSelection, quantity }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const fitDetails = await validateFitSelection(
      ctx,
      fitSelection,
      ownerClerkUserId,
    );
    const now = Date.now();
    const nextLine = await buildLineItem(
      validated,
      fitDetails,
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
    fitSelection: fitSelectionValidator,
    quantity: quantityValidator,
  },
  handler: async (ctx, { lineId, configuration, fitSelection, quantity }) => {
    const ownerClerkUserId = await requireAuthenticatedClerkUserId(ctx);
    const cart = await requireCart(ctx, ownerClerkUserId);
    const existingLine = cart.lineItems.find((item) => item.lineId === lineId);

    if (!existingLine) {
      throw new ConvexError("Cart item not found.");
    }

    const validated = await validateConfigurationSnapshot(ctx, configuration);
    const fitDetails = await validateFitSelection(
      ctx,
      fitSelection,
      ownerClerkUserId,
    );
    const now = Date.now();
    const nextLine = await buildLineItem(
      validated,
      fitDetails,
      normalizeQuantity(quantity),
      existingLine.createdAt,
      now,
    );
    const remainingLines = cart.lineItems.filter(
      (item) => item.lineId !== lineId,
    );

    await patchCartLines(
      ctx,
      cart,
      mergeLineItems(remainingLines, nextLine),
    );

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

      if (item.fitMethod !== "made-to-measure") {
        throw new ConvexError(
          "Measurement choices only apply to Made to Measure suits.",
        );
      }

      const remainingItem = { ...item };
      delete remainingItem.measurementProfileId;
      delete remainingItem.measurementProfileName;
      delete remainingItem.measurementAppointmentRequired;

      return {
        ...remainingItem,
        fitMethod: "made-to-measure" as const,
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
          await validateFitSelection(
            ctx,
            item.fitSelection,
            ownerClerkUserId,
          ),
          normalizeQuantity(item.quantity),
          now,
        )),
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
  fitDetails: CartFitDetails,
  quantity: number,
  createdAt: number,
  updatedAt = createdAt,
): Promise<CartLineItem> {
  return {
    lineId: await createCartLineId(
      `${validated.selectionSignature}|${createFitSignature(fitDetails)}`,
    ),
    productId: validated.product._id,
    productSlug: validated.product.slug,
    productName: validated.product.name,
    previewImageReference: validated.previewImageReference,
    configuration: validated.configuration,
    selections: validated.selections,
    personalization: validated.personalization,
    unitPriceCents: validated.priceCents,
    quantity,
    ...fitDetails,
    createdAt,
    updatedAt,
  };
}

async function validateFitSelection(
  ctx: MutationCtx,
  fitSelection: FitSelection,
  ownerClerkUserId?: string,
): Promise<CartFitDetails> {
  if (fitSelection.fitMethod === "standard") {
    const jacketSize = fitSelection.jacketSize.trim().toUpperCase();
    const trouserSize = fitSelection.trouserSize?.trim().toUpperCase() ?? "";
    const trouserWaist = fitSelection.trouserWaist?.trim() ?? "";
    const trouserInseam = fitSelection.trouserInseam?.trim() ?? "";

    if (!jacketSize) {
      throw new ConvexError("Choose a jacket size for Standard Fit.");
    }

    if (!trouserSize && (!trouserWaist || !trouserInseam)) {
      throw new ConvexError(
        "Choose a trouser size or trouser waist and inseam for Standard Fit.",
      );
    }

    return {
      fitMethod: "standard",
      jacketSize,
      ...(trouserSize ? { trouserSize } : { trouserWaist, trouserInseam }),
      fitPreference: fitSelection.fitPreference,
    };
  }

  if (!ownerClerkUserId) {
    throw new ConvexError("Made to Measure requires an account.");
  }

  if (fitSelection.measurementProfileId && fitSelection.measurementAppointmentRequired) {
    throw new ConvexError(
      "Choose a measurement profile or request an appointment, not both.",
    );
  }

  if (fitSelection.measurementProfileId) {
    const profile = await requireOwnedProfile(
      ctx,
      fitSelection.measurementProfileId,
      ownerClerkUserId,
    );

    return {
      fitMethod: "made-to-measure",
      measurementProfileId: profile._id,
      measurementProfileName: profile.name,
    };
  }

  if (fitSelection.measurementAppointmentRequired) {
    return {
      fitMethod: "made-to-measure",
      measurementAppointmentRequired: true,
    };
  }

  throw new ConvexError(
    "Made to Measure requires a measurement profile or appointment request.",
  );
}

async function validateCartLineFit(
  ctx: QueryCtx,
  lineItem: CartLineItem,
  ownerClerkUserId: string,
  required: boolean,
) {
  if (lineItem.fitMethod === "standard") {
    if (
      lineItem.jacketSize &&
      lineItem.fitPreference &&
      (lineItem.trouserSize || (lineItem.trouserWaist && lineItem.trouserInseam))
    ) {
      return {
        fitMethod: "standard",
        jacketSize: lineItem.jacketSize,
        ...(lineItem.trouserSize
          ? { trouserSize: lineItem.trouserSize }
          : {
              trouserWaist: lineItem.trouserWaist,
              trouserInseam: lineItem.trouserInseam,
            }),
        fitPreference: lineItem.fitPreference,
      } as CartFitDetails;
    }

    if (required) {
      throw new ConvexError(
        `${lineItem.productName} needs standard jacket and trouser sizes.`,
      );
    }

    return {
      fitMethod: "standard",
      jacketSize: lineItem.jacketSize ?? "",
      fitPreference: lineItem.fitPreference ?? "classic",
    } as CartFitDetails;
  }

  if (lineItem.measurementAppointmentRequired) {
    return {
      fitMethod: "made-to-measure",
      measurementAppointmentRequired: true,
    } as CartFitDetails;
  }

  if (lineItem.measurementProfileId) {
    const profile = await ctx.db.get(lineItem.measurementProfileId);

    if (profile?.ownerClerkUserId === ownerClerkUserId) {
      return {
        fitMethod: "made-to-measure",
        measurementProfileId: profile._id,
        measurementProfileName: profile.name,
      } as CartFitDetails;
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

  return {
    fitMethod: "made-to-measure",
  } as CartFitDetails;
}

function createFitSignature(fitDetails: CartFitDetails) {
  if (fitDetails.fitMethod === "standard") {
    return [
      "fit:standard",
      `jacket:${stableValue(fitDetails.jacketSize)}`,
      `trouserSize:${stableValue(fitDetails.trouserSize ?? "")}`,
      `waist:${stableValue(fitDetails.trouserWaist ?? "")}`,
      `inseam:${stableValue(fitDetails.trouserInseam ?? "")}`,
      `pref:${fitDetails.fitPreference}`,
    ].join("|");
  }

  return [
    "fit:made-to-measure",
    `profile:${stableValue(fitDetails.measurementProfileId ?? "")}`,
    `appointment:${fitDetails.measurementAppointmentRequired ? "true" : "false"}`,
  ].join("|");
}

function stableValue(value: string) {
  return value.trim().toLowerCase().replaceAll("|", "%7C");
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
