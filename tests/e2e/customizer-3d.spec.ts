import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", size: { width: 1280, height: 900 } },
  { name: "mobile", size: { width: 390, height: 844 } },
];

test("hides the experimental 3D preview by default on desktop and mobile", async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport.size);
    await page.goto("/customize/house-navy-hopsack-suit");

    await expect(
      page.getByRole("heading", { name: "Customize The House Suit" }),
      `${viewport.name} customizer heading`,
    ).toBeVisible();

    await expect(page.getByRole("tab", { name: "3D" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "2D" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Summary" })).toBeVisible();

    await expect(
      page.getByRole("img", { name: /suit fabric preview/i }).first(),
      `${viewport.name} 2D preview`,
    ).toBeVisible();

    await page.getByRole("tab", { name: "Summary" }).click();
    await expect(page.getByText("Total").first()).toBeVisible();
  }
});
