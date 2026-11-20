import { expect, test } from "@playwright/test";

const SUIT = "house-navy-hopsack-suit";

test("opens the studio from the customizer and keeps the design", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/customize/${SUIT}`);
  await page.getByRole("link", { name: "Open studio" }).click();
  // Generous: under `next dev` the first visit compiles the route.
  await expect(page).toHaveURL(new RegExp(`/studio/${SUIT}$`), {
    timeout: 30_000,
  });

  const scene = page.getByRole("region", {
    name: "Full-screen 3D suit studio",
  });
  await expect(scene).toHaveAttribute("data-ready", "true", {
    timeout: 60_000,
  });
  await expect(page.getByTestId("suit-studio-canvas")).toBeVisible();

  const steps = page.getByRole("navigation", { name: "Studio steps" });
  await steps.getByRole("button", { name: "Lapel", exact: true }).click();
  await expect(scene).toHaveAttribute("data-active-step", "lapel");
  await page.getByRole("button", { name: /^Peak lapel/ }).click();
  await expect(scene).toHaveAttribute("data-lapel", "peak-lapel");

  await page
    .getByRole("toolbar", { name: "Studio tools" })
    .getByRole("button", { name: "Evening", exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-mood", "evening");

  await page.getByRole("link", { name: "Continue to details" }).click();
  await expect(page).toHaveURL(new RegExp(`/customize/${SUIT}$`));
  await expect(
    page.getByRole("region", { name: "Interactive 3D suit preview" }),
  ).toHaveAttribute("data-lapel", "peak-lapel", { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test("shows the options as a bottom sheet on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/studio/${SUIT}`);
  await expect(
    page.getByRole("region", { name: "Full-screen 3D suit studio" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const panel = page.getByRole("region", { name: "Design options" });
  const box = await panel.boundingBox();
  expect(box?.y).toBeGreaterThan(844 / 2);

  await page.getByRole("button", { name: "Hide options" }).click();
  await expect(panel).toBeHidden();
});
