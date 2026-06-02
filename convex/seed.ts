import type { Id, TableNames } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import {
  categorySeeds,
  customizationGroupSeeds,
  customizationOptionSeeds,
  fabricSeeds,
  productSeeds,
} from "./seedData";

const tableNames: TableNames[] = [
  "productCustomizationAvailability",
  "products",
  "customizationOptions",
  "customizationGroups",
  "fabrics",
  "categories",
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const tableName of tableNames) {
      const records = await ctx.db.query(tableName).collect();

      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    const now = Date.now();
    const categoryIds = new Map<string, Id<"categories">>();
    const fabricIds = new Map<string, Id<"fabrics">>();
    const groupIds = new Map<string, Id<"customizationGroups">>();
    const optionIds = new Map<string, Id<"customizationOptions">>();

    for (const category of categorySeeds) {
      const id = await ctx.db.insert("categories", {
        ...category,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      categoryIds.set(category.slug, id);
    }

    for (const fabric of fabricSeeds) {
      const id = await ctx.db.insert("fabrics", {
        ...fabric,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      fabricIds.set(fabric.code, id);
    }

    for (const group of customizationGroupSeeds) {
      const id = await ctx.db.insert("customizationGroups", {
        ...group,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      groupIds.set(group.code, id);
    }

    for (const option of customizationOptionSeeds) {
      const customizationGroupId = requireValue(
        groupIds,
        option.groupCode,
        "customization group",
      );
      const id = await ctx.db.insert("customizationOptions", {
        code: option.code,
        label: option.label,
        description: option.description,
        priceModifierCents: option.priceModifierCents,
        compatibilityMetadata:
          "compatibilityMetadata" in option
            ? option.compatibilityMetadata
            : undefined,
        displayOrder: option.displayOrder,
        customizationGroupId,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      optionIds.set(option.code, id);
    }

    for (const product of productSeeds) {
      const categoryId = requireValue(
        categoryIds,
        product.categorySlug,
        "category",
      );
      const availableFabricIds = product.fabricCodes.map((code) =>
        requireValue(fabricIds, code, "fabric"),
      );
      const productId = await ctx.db.insert("products", {
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        fullDescription: product.fullDescription,
        basePriceCents: product.basePriceCents,
        imageReferences: product.imageReferences.map((image) => ({ ...image })),
        badge: "badge" in product ? product.badge : undefined,
        featured: product.featured,
        displayOrder: product.displayOrder,
        categoryId,
        availableFabricIds,
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      for (const optionCode of product.customizationOptionCodes) {
        const customizationOptionId = requireValue(
          optionIds,
          optionCode,
          "customization option",
        );
        const option = await ctx.db.get(customizationOptionId);

        if (!option) {
          throw new Error(`Missing customization option: ${optionCode}`);
        }

        await ctx.db.insert("productCustomizationAvailability", {
          productId,
          customizationGroupId: option.customizationGroupId,
          customizationOptionId,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      categories: categorySeeds.length,
      fabrics: fabricSeeds.length,
      customizationGroups: customizationGroupSeeds.length,
      customizationOptions: customizationOptionSeeds.length,
      products: productSeeds.length,
    };
  },
});

function requireValue<Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  label: string,
) {
  const value = map.get(key);

  if (!value) {
    throw new Error(`Missing ${label}: ${String(key)}`);
  }

  return value;
}
