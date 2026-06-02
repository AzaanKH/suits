import { beforeEach, describe, expect, it } from "vitest";

import { products } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("adds products and increments an existing quantity", () => {
    const product = products[0];

    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ id: product.id, quantity: 2 }),
    ]);
  });
});
