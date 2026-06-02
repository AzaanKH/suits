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

  await page
    .getByRole("button", { name: /add the house suit in midnight navy/i })
    .click();
  await page.getByRole("link", { name: /cart with 1 item/i }).click();

  await expect(
    page.getByRole("heading", { name: "Shopping cart" }),
  ).toBeVisible();
  await expect(page.getByText("The House Suit")).toBeVisible();
});
