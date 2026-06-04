import { beforeEach, describe, expect, it } from "vitest";

import {
  getCartItemCount,
  getCartSubtotal,
  type CartLineItem,
  useCartStore,
} from "@/store/cart-store";

const baseLineItem: CartLineItem = {
  lineId: "line_house_default",
  productId: "product_house",
  productSlug: "house-navy-hopsack-suit",
  productName: "The House Suit",
  previewImageReference: {
    src: "/images/suit-navy.png",
    alt: "Navy suit",
  },
  configuration: {
    version: 1,
    productId: "product_house",
    productSlug: "house-navy-hopsack-suit",
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-two-button"],
      lapel: ["notch-lapel"],
      buttons: ["horn-buttons"],
      pockets: ["straight-flap-pockets"],
      trousers: ["side-adjusters"],
      extras: [],
    },
    personalization: {
      monogramText: "",
      notes: "",
    },
  },
  selections: [
    {
      stepCode: "fabric",
      groupLabel: "Fabric",
      optionCode: "navy-hopsack",
      optionLabel: "Midnight navy hopsack",
      priceModifierCents: 0,
    },
  ],
  personalization: {
    monogramText: "",
    notes: "",
  },
  unitPriceCents: 119500,
  quantity: 1,
  createdAt: 1,
  updatedAt: 1,
};

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("adds configured snapshots and increments an existing quantity", () => {
    useCartStore.getState().addItem(baseLineItem);
    useCartStore.getState().addItem({ ...baseLineItem, quantity: 2 });

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        lineId: baseLineItem.lineId,
        quantity: 3,
      }),
    ]);
  });

  it("keeps different configuration snapshots as separate entries", () => {
    const monogramLine = {
      ...baseLineItem,
      lineId: "line_house_monogram",
      unitPriceCents: 123000,
      configuration: {
        ...baseLineItem.configuration,
        selectedOptionCodes: {
          ...baseLineItem.configuration.selectedOptionCodes,
          extras: ["personal-monogram"],
        },
        personalization: {
          monogramText: "AK",
          notes: "",
        },
      },
    };

    useCartStore.getState().addItem(baseLineItem);
    useCartStore.getState().addItem(monogramLine);

    expect(useCartStore.getState().items).toHaveLength(2);
    expect(getCartItemCount(useCartStore.getState().items)).toBe(2);
    expect(getCartSubtotal(useCartStore.getState().items)).toBe(242500);
  });

  it("intentionally updates one line without mutating another snapshot", () => {
    const editedLine = {
      ...baseLineItem,
      lineId: "line_house_edited",
      unitPriceCents: 127000,
      configuration: {
        ...baseLineItem.configuration,
        fabricCode: "grey-traveller",
      },
    };

    useCartStore.getState().addItem(baseLineItem);
    useCartStore.getState().updateItem(baseLineItem.lineId, editedLine);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        lineId: editedLine.lineId,
        configuration: expect.objectContaining({ fabricCode: "grey-traveller" }),
      }),
    ]);
  });

  it("updates quantity and removes an item by line ID", () => {
    useCartStore.getState().addItem(baseLineItem);
    useCartStore.getState().updateQuantity(baseLineItem.lineId, 4);
    useCartStore.getState().removeItem(baseLineItem.lineId);

    expect(useCartStore.getState().items).toEqual([]);
  });
});
