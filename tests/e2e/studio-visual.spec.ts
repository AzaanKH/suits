import { expect, test, type Page } from "@playwright/test";

const SUIT = "house-navy-hopsack-suit";

declare global {
  interface Window {
    __ARDEN_TEST__?: boolean;
    __ardenStudio?: {
      screenPoint(name: string, side?: 1 | -1): { x: number; y: number } | null;
    };
  }
}

async function openStudio(page: Page) {
  await page.addInitScript(() => {
    window.__ARDEN_TEST__ = true;
    sessionStorage.setItem("arden-studio-floor", "visited");
  });
  await page.goto(`/studio/${SUIT}`);
  const scene = page.getByRole("region", {
    name: "Full-screen 3D suit studio",
  });
  await expect(scene).toHaveAttribute("data-ready", "true", {
    timeout: 60_000,
  });
  return scene;
}

async function step(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Studio steps" })
    .getByRole("button", { name })
    .click();
  await page.waitForTimeout(1500);
}

async function hoverPart(page: Page, mesh: string, side?: 1 | -1) {
  let point: { x: number; y: number } | null = null;
  await expect
    .poll(
      async () =>
        (point = await page.evaluate(
          ([name, s]) => window.__ardenStudio?.screenPoint(name, s) ?? null,
          [mesh, side] as const,
        )),
      { message: `${mesh} is on screen`, timeout: 30_000 },
    )
    .not.toBeNull();
  await page.mouse.move(point!.x, point!.y);
  return page.locator(".atelier-tooltip");
}

test("pointing at a button targets the buttons, not the jacket", async ({
  page,
}) => {
  await openStudio(page);
  await step(page, "Pockets");
  for (const button of ["single_button_10", "single_button_11"]) {
    const tooltip = await hoverPart(page, button);
    await expect(tooltip, button).toHaveText("Change buttons");
  }
  const point = await page.evaluate(() =>
    window.__ardenStudio!.screenPoint("single_button_11"),
  );
  await page.mouse.click(point!.x, point!.y);
  await expect(
    page
      .getByRole("navigation", { name: "Studio steps" })
      .getByRole("button", { name: "Buttons" }),
  ).toHaveAttribute("aria-current", "step");
});

test("each pocket style can be pointed at and shows its own mesh", async ({
  page,
}) => {
  const scene = await openStudio(page);
  await step(page, "Pockets");
  const panel = page.getByRole("region", { name: "Design options" });
  for (const [label, mesh] of [
    ["Straight flap", "single_pocket_flap"],
    ["Slanted flap", "single_pocket_slanted"],
    ["Patch pockets", "single_pocket_patch"],
  ] as const) {
    await panel.getByText(label, { exact: true }).first().click();
    await expect(scene).toHaveAttribute("data-pocket-mesh", mesh);
    const tooltip = await hoverPart(page, mesh, 1);
    await expect(tooltip, label).toHaveText("Change pockets");
  }
});

test("the trousers step shows only the trousers", async ({ page }) => {
  const scene = await openStudio(page);
  await expect(scene).toHaveAttribute("data-trousers-only", "false");
  await step(page, "Trousers");
  await expect(scene).toHaveAttribute("data-trousers-only", "true");
  await page
    .getByRole("region", { name: "Design options" })
    .getByText("Belt loops", { exact: true })
    .first()
    .click();
  const tooltip = await hoverPart(page, "waist_loop_1");
  await expect(tooltip).toHaveText("Change trousers");
  await step(page, "Buttons");
  await expect(scene).toHaveAttribute("data-trousers-only", "false");
});
