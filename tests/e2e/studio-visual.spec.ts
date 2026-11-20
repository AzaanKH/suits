import { expect, test, type Page } from "@playwright/test";

const SUIT = "house-navy-hopsack-suit";

declare global {
  interface Window {
    __ARDEN_TEST__?: boolean;
    __ardenStudio?: {
      look(
        position: [number, number, number],
        target: [number, number, number],
      ): Promise<void>;
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

type Box = { x: number; y: number; width: number; height: number };

async function outlinePixels(page: Page, box: Box) {
  const shot = await page.screenshot({ clip: box });
  return page.evaluate(async (png) => {
    const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    let count = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 2] > 150 && data[i + 2] - data[i] > 90) count++;
    return count;
  }, shot.toString("base64"));
}

test("hovering the jacket outlines its edge, not the cloth around the pockets", async ({
  page,
}) => {
  await openStudio(page);
  await page.evaluate(() =>
    window.__ardenStudio!.look([0, 0.95, 0.85], [0, 0.93, 0.1]),
  );
  await page.waitForTimeout(1000);
  const boxes: Box[] = [];
  for (const side of [1, -1] as const) {
    const flap = await page.evaluate(
      (s) => window.__ardenStudio!.screenPoint("single_pocket_flap", s),
      side,
    );
    expect(flap, "pocket flap on screen").not.toBeNull();
    boxes.push({ x: flap!.x - 50, y: flap!.y - 25, width: 100, height: 50 });
  }
  const before = await Promise.all(boxes.map((b) => outlinePixels(page, b)));
  await page.mouse.move(boxes[0].x + 50, boxes[0].y - 90);
  await expect(page.locator(".atelier-tooltip")).toHaveText("Change jacket");
  await page.waitForTimeout(500);
  const after = await Promise.all(boxes.map((b) => outlinePixels(page, b)));
  for (const [i, box] of boxes.entries())
    expect(
      after[i] - before[i],
      `outline pixels inside ${JSON.stringify(box)}`,
    ).toBeLessThan(40);
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

test("the pockets step adds a ticket pocket and shows the inside pockets", async ({
  page,
}) => {
  const scene = await openStudio(page);
  await step(page, "Pockets");
  const ticket = page.getByRole("group", { name: "Ticket pocket" });
  const inside = page.getByRole("group", { name: "Interior pockets" });

  await ticket.getByRole("button", { name: "Flap", exact: true }).click();
  await expect(scene).toHaveAttribute("data-inside-view", "false");
  await expect(await hoverPart(page, "single_ticket_flap", -1)).toHaveText(
    "Change pockets",
  );

  await inside.getByRole("button", { name: "Travel pockets" }).click();
  await expect(scene).toHaveAttribute("data-inside-view", "true");
  await page.waitForTimeout(1500);
  for (const slot of ["chest_l", "pen", "lower_r"]) {
    const tooltip = await hoverPart(page, `single_inpocket_${slot}`);
    await expect(tooltip, slot).toHaveText("Change pockets");
  }

  await inside.getByRole("button", { name: "None", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__ardenStudio!.screenPoint("single_inpocket_chest_l"),
      ),
    )
    .toBeNull();

  await page.getByRole("button", { name: "Back to the front" }).click();
  await expect(scene).toHaveAttribute("data-inside-view", "false");
  await page.getByRole("button", { name: "View inside" }).click();
  await expect(scene).toHaveAttribute("data-inside-view", "true");
  await step(page, "Buttons");
  await expect(scene).toHaveAttribute("data-inside-view", "false");
});
