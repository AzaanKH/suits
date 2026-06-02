import { expect, test } from "@playwright/test";

test("shows the home page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /clothes that hold their line/i,
    }),
  ).toBeVisible();
});

test("navigates to the collection and adds a suit to the cart", async ({
  page,
}) => {
  await page.goto("/shop");

  await page.getByTestId("add-to-cart-house-navy").click();
  await page.getByTestId("cart-link").click();

  await expect(
    page.getByRole("heading", { name: "Shopping cart" }),
  ).toBeVisible();
  await expect(page.getByText("The House Suit")).toBeVisible();
});

test("filters the collection by product category", async ({ page }) => {
  await page.goto("/shop");

  await page.getByRole("button", { name: "Signature Collection" }).click();

  await expect(page.getByText("The Signature DB")).toBeVisible();
  await expect(page.getByText("The House Suit")).not.toBeVisible();
});
