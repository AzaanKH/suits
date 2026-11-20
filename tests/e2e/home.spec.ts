import { expect, test } from "@playwright/test";

test("leads from the home page into the studio", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /cut for one/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the studio" }).first(),
  ).toHaveAttribute("href", "/studio/house-navy-hopsack-suit");
});

test("switches between light and dark themes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /^Theme:/ }).first();

  await expect(html).not.toHaveClass(/dark/);
  await toggle.click(); // system -> light
  await expect(toggle).toHaveAccessibleName(/Theme: Light/);
  await toggle.click(); // light -> dark
  await expect(html).toHaveClass(/dark/);

  // The choice survives a reload.
  await page.reload();
  await expect(html).toHaveClass(/dark/);
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
  // The House Suit has the 3D studio, so it leads there; the 2D customizer stays one click away.
  await expect(
    page.getByRole("link", { name: "Open the studio" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Customize without 3D" }),
  ).toBeVisible();
});

test("completes the customization flow", async ({ page }) => {
  // Each step's primary action reads "Continue to <next step>".
  const next = () =>
    page.getByRole("button", { name: /^(Continue to|Next)/ }).click();
  const configuration = page.getByRole("region", {
    name: "Suit configuration",
  });
  await page.goto("/customize/house-navy-hopsack-suit");

  await expect(
    configuration.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  await expect(configuration.getByText("The House Suit")).toBeVisible();

  await page.getByRole("button", { name: /Slate grey traveller wool/ }).click();
  await next();

  await page
    .getByRole("button", { name: /Six-button double-breasted/ })
    .click();
  await next();

  await expect(
    page.getByRole("button", { name: /Notch lapel/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("button", { name: /Peak lapel/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await next();

  await page.getByRole("button", { name: /Self-covered/ }).click();
  await next();

  await page.getByRole("button", { name: /Jetted pockets/ }).click();
  await next();

  await page.getByRole("button", { name: /Single pleat/ }).click();
  await next();

  await expect(
    page.getByRole("button", { name: /Matching waistcoat/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: /Personal monogram/ }).click();
  await page.getByRole("button", { name: /Working cuffs/ }).click();
  await page.getByLabel("Monogram initials").fill("AK");
  await page.getByLabel("Tailoring notes").fill("Cleaner trouser break.");
  await next(); // Details
  await next(); // Fit
  await next(); // Review

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
    configuration.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Midnight navy hopsack/ }).click();
  const updateCartButton = page.getByRole("button", { name: "Update cart" });
  for (let step = 0; step < 10; step += 1) {
    if (await updateCartButton.isVisible()) {
      break;
    }

    await next();
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
