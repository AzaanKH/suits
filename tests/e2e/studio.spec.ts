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
  await expect(page).toHaveURL(new RegExp(`/customize/${SUIT}$`), {
    timeout: 30_000,
  });
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

test("invites the visitor onto the floor and lets them wear a house pick", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // `?explore` sends the invitation straight away instead of after a while.
  await page.goto(`/studio/${SUIT}?explore`);
  const scene = page.getByRole("region", {
    name: "Full-screen 3D suit studio",
  });
  await expect(scene).toHaveAttribute("data-ready", "true", {
    timeout: 60_000,
  });

  await expect(page.getByText("Take a look around.")).toBeVisible();
  await page.getByRole("button", { name: "Show me" }).click();

  const panel = page.getByRole("region", { name: "Design options" });
  await expect(
    panel.getByRole("heading", { name: "On the floor" }),
  ).toBeVisible();
  await panel.getByRole("button", { name: /Navy double-breasted/ }).click();
  await expect(
    panel.getByRole("heading", { name: "Navy double-breasted" }),
  ).toBeVisible();
  await expect(panel.getByText("Six-button double-breasted")).toBeVisible();

  await panel.getByRole("button", { name: "Wear this design" }).click();
  await expect(scene).toHaveAttribute(
    "data-jacket",
    "double-breasted-six-button",
    { timeout: 30_000 },
  );
  await expect(
    panel.getByRole("heading", { name: "Choose your cloth" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
