import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/store/cart-store";
import { productFixtures } from "@/test/fixtures";

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("adds products and increments an existing quantity", () => {
    const product = productFixtures[0];

    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ id: product.id, quantity: 2 }),
    ]);
  });

  it("adds different products as separate entries", () => {
    const firstProduct = productFixtures[0];
    const secondProduct = productFixtures[1];

    useCartStore.getState().addItem(firstProduct);
    useCartStore.getState().addItem(secondProduct);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ id: firstProduct.id, quantity: 1 }),
      expect.objectContaining({ id: secondProduct.id, quantity: 1 }),
    ]);
  });

  it("removes an item by product ID", () => {
    const product = productFixtures[0];

    useCartStore.getState().addItem(product);
    useCartStore.getState().removeItem(product.id);

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("clears the cart", () => {
    useCartStore.getState().addItem(productFixtures[0]);
    useCartStore.getState().addItem(productFixtures[1]);
    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
  });
});
