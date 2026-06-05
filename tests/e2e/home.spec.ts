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

  await page
    .getByRole("link", { name: /The House Suit/ })
    .first()
    .click();

  await expect(
    page.getByRole("heading", { name: "The House Suit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Begin customization" }),
  ).toBeVisible();
});

test("completes the two-dimensional customization flow", async ({ page }) => {
  await page.goto("/customize/house-navy-hopsack-suit");

  await expect(
    page.getByRole("heading", { name: "Customize The House Suit" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Slate grey traveller wool/ }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page
    .getByRole("button", { name: /Six-button double-breasted/ })
    .click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("button", { name: /Notch lapel/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("button", { name: /Peak lapel/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: /Self-covered/ }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: /Jetted pockets/ }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: /Single pleat/ }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("button", { name: /Matching waistcoat/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: /Personal monogram/ }).click();
  await page.getByRole("button", { name: /Working cuffs/ }).click();
  await page.getByLabel("Monogram initials").fill("AK");
  await page.getByLabel("Tailoring notes").fill("Cleaner trouser break.");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByText("Slate grey traveller wool").first(),
  ).toBeVisible();
  await expect(page.getByText("Six-button double-breasted")).toBeVisible();
  await expect(page.getByText("Self-covered")).toBeVisible();
  await expect(page.getByText("The House Suit / $1,695.00")).toBeVisible();

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(
    page.getByRole("heading", { name: "Shopping cart" }),
  ).toBeVisible();
  await expect(
    page.getByText("Slate grey traveller wool").first(),
  ).toBeVisible();
  await expect(page.getByText("$1,695.00").first()).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(
    page.getByRole("heading", { name: "Customize The House Suit" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Midnight navy hopsack/ }).click();
  const updateCartButton = page.getByRole("button", { name: "Update cart" });
  for (let step = 0; step < 10; step += 1) {
    if (await updateCartButton.isVisible()) {
      break;
    }

    await page.getByRole("button", { name: "Next" }).click();
  }
  await expect(updateCartButton).toBeEnabled();
  await updateCartButton.click();
  await expect(page.getByText("Midnight navy hopsack")).toBeVisible();

  await page.getByRole("button", { name: /Remove/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your cart is empty." }),
  ).toBeVisible();
});

test("filters the collection by product category", async ({ page }) => {
  await page.goto("/shop");

  await page.getByRole("button", { name: "Occasion" }).click();

  await expect(page.getByText("The Occasion Suit")).toBeVisible();
  await expect(page.getByText("The House Suit")).not.toBeVisible();
});
