import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const imageReference = v.object({
  src: v.string(),
  alt: v.string(),
});

const personalization = v.object({
  monogramText: v.string(),
  notes: v.string(),
});

const configurationSelection = v.object({
  stepCode: v.string(),
  groupLabel: v.string(),
  optionCode: v.string(),
  optionLabel: v.string(),
  priceModifierCents: v.number(),
});

const savedConfiguration = v.object({
  version: v.literal(1),
  productId: v.id("products"),
  productSlug: v.string(),
  fabricCode: v.string(),
  selectedOptionCodes: v.record(v.string(), v.array(v.string())),
  personalization,
});

const cartLineItem = v.object({
  lineId: v.string(),
  productId: v.id("products"),
  productSlug: v.string(),
  productName: v.string(),
  previewImageReference: v.optional(imageReference),
  configuration: savedConfiguration,
  selections: v.array(configurationSelection),
  personalization,
  unitPriceCents: v.number(),
  quantity: v.number(),
  fitMethod: v.optional(
    v.union(v.literal("standard"), v.literal("made-to-measure")),
  ),
  jacketSize: v.optional(v.string()),
  trouserSize: v.optional(v.string()),
  trouserWaist: v.optional(v.string()),
  trouserInseam: v.optional(v.string()),
  fitPreference: v.optional(
    v.union(v.literal("slim"), v.literal("classic"), v.literal("relaxed")),
  ),
  measurementProfileId: v.optional(v.id("measurementProfiles")),
  measurementProfileName: v.optional(v.string()),
  measurementAppointmentRequired: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const shippingAddress = v.object({
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

const orderPaymentStatus = v.union(
  v.literal("checkout_pending"),
  v.literal("unpaid"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("refunded"),
);

const orderFulfillmentStatus = v.union(
  v.literal("unfulfilled"),
  v.literal("in_production"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
);

const stripeEventProcessingStatus = v.union(
  v.literal("processed"),
  v.literal("ignored"),
  v.literal("failed"),
);

export default defineSchema({
  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    active: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active_display_order", ["active", "displayOrder"]),

  fabrics: defineTable({
    code: v.string(),
    name: v.string(),
    mill: v.string(),
    color: v.string(),
    composition: v.string(),
    weight: v.string(),
    seasonality: v.string(),
    description: v.string(),
    imageReference: v.optional(imageReference),
    active: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active_display_order", ["active", "displayOrder"]),

  customizationGroups: defineTable({
    code: v.string(),
    label: v.string(),
    description: v.string(),
    active: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active_display_order", ["active", "displayOrder"]),

  customizationOptions: defineTable({
    code: v.string(),
    label: v.string(),
    description: v.string(),
    customizationGroupId: v.id("customizationGroups"),
    priceModifierCents: v.number(),
    imageReference: v.optional(imageReference),
    active: v.boolean(),
    compatibilityMetadata: v.optional(v.any()),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_group_display_order", ["customizationGroupId", "displayOrder"]),

  products: defineTable({
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    fullDescription: v.string(),
    basePriceCents: v.number(),
    categoryId: v.id("categories"),
    imageReferences: v.array(imageReference),
    badge: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    displayOrder: v.number(),
    availableFabricIds: v.array(v.id("fabrics")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active_display_order", ["active", "displayOrder"])
    .index("by_active_featured_display_order", [
      "active",
      "featured",
      "displayOrder",
    ]),

  productCustomizationAvailability: defineTable({
    productId: v.id("products"),
    customizationGroupId: v.id("customizationGroups"),
    customizationOptionId: v.id("customizationOptions"),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_group", ["productId", "customizationGroupId"]),

  savedDesigns: defineTable({
    ownerClerkUserId: v.string(),
    productId: v.id("products"),
    productSlug: v.string(),
    productName: v.string(),
    name: v.string(),
    priceCents: v.number(),
    previewImageReference: v.optional(imageReference),
    configuration: savedConfiguration,
    selections: v.array(configurationSelection),
    personalization,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_updated_at", ["ownerClerkUserId", "updatedAt"])
    .index("by_owner_product_updated_at", [
      "ownerClerkUserId",
      "productId",
      "updatedAt",
    ]),

  measurementProfiles: defineTable({
    ownerClerkUserId: v.string(),
    name: v.string(),
    units: v.union(v.literal("in"), v.literal("cm")),
    bodyMeasurementsInches: v.object({
      chest: v.number(),
      waist: v.number(),
      hips: v.number(),
      shoulderWidth: v.number(),
      sleeveLength: v.number(),
      jacketLength: v.number(),
      trouserWaist: v.number(),
      inseam: v.number(),
      outseam: v.number(),
    }),
    fitPreferences: v.object({
      jacketFit: v.union(
        v.literal("slim"),
        v.literal("classic"),
        v.literal("relaxed"),
      ),
      trouserFit: v.union(
        v.literal("tapered"),
        v.literal("straight"),
        v.literal("relaxed"),
      ),
      shoulderPreference: v.union(
        v.literal("natural"),
        v.literal("structured"),
        v.literal("soft"),
      ),
      trouserBreak: v.union(
        v.literal("none"),
        v.literal("slight"),
        v.literal("medium"),
        v.literal("full"),
      ),
    }),
    notes: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_updated_at", ["ownerClerkUserId", "updatedAt"]),

  carts: defineTable({
    ownerClerkUserId: v.string(),
    lineItems: v.array(cartLineItem),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerClerkUserId"]),

  orders: defineTable({
    ownerClerkUserId: v.string(),
    checkoutAttemptKey: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    shippingAddress,
    subtotalCents: v.number(),
    taxCents: v.optional(v.number()),
    taxRateBps: v.optional(v.number()),
    taxJurisdictionCode: v.optional(v.string()),
    taxJurisdictionName: v.optional(v.string()),
    totalCents: v.optional(v.number()),
    currency: v.string(),
    paymentStatus: orderPaymentStatus,
    fulfillmentStatus: orderFulfillmentStatus,
    itemCount: v.number(),
    paymentConfirmedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_created_at", ["ownerClerkUserId", "createdAt"])
    .index("by_owner_checkout_attempt_key", [
      "ownerClerkUserId",
      "checkoutAttemptKey",
    ])
    .index("by_stripe_checkout_session", ["stripeCheckoutSessionId"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    ownerClerkUserId: v.string(),
    lineId: v.string(),
    productId: v.id("products"),
    productSlug: v.string(),
    productName: v.string(),
    previewImageReference: v.optional(imageReference),
    configurationSnapshot: savedConfiguration,
    selectionsSnapshot: v.array(configurationSelection),
    personalizationSnapshot: personalization,
    unitPriceCents: v.number(),
    quantity: v.number(),
    lineSubtotalCents: v.number(),
    fitMethod: v.union(v.literal("standard"), v.literal("made-to-measure")),
    jacketSize: v.optional(v.string()),
    trouserSize: v.optional(v.string()),
    trouserWaist: v.optional(v.string()),
    trouserInseam: v.optional(v.string()),
    fitPreference: v.optional(
      v.union(v.literal("slim"), v.literal("classic"), v.literal("relaxed")),
    ),
    measurementProfileId: v.optional(v.id("measurementProfiles")),
    measurementProfileName: v.optional(v.string()),
    measurementAppointmentRequired: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_owner", ["ownerClerkUserId"]),

  stripeEvents: defineTable({
    stripeEventId: v.string(),
    eventType: v.string(),
    stripeObjectId: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
    processingStatus: stripeEventProcessingStatus,
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_event_id", ["stripeEventId"])
    .index("by_order", ["orderId"]),
});
