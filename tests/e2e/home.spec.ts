import { expect, test } from "@playwright/test";

test("shows the home page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /a custom suit, without the old rules/i,
    }),
  ).toBeVisible();
});

test("navigates from the collection to a suit detail page", async ({
  page,
}) => {
  await page.goto("/shop");

  await page.getByRole("link", { name: "The House Suit", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "The House Suit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Begin customization" }),
  ).toBeVisible();
});

test("filters the collection by product category", async ({ page }) => {
  await page.goto("/shop");

  await page.getByRole("button", { name: "Occasion" }).click();

  await expect(page.getByText("The Occasion Suit")).toBeVisible();
  await expect(page.getByText("The House Suit")).not.toBeVisible();
});
