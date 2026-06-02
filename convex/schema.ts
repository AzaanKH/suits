import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const imageReference = v.object({
  src: v.string(),
  alt: v.string(),
});

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
});
