import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const viewports = [
  { name: "desktop", size: { width: 1440, height: 1000 } },
  { name: "mobile", size: { width: 390, height: 844 } },
];

for (const viewport of viewports) {
  test(`tailoring requests stay independent and export on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport.size);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/customize/house-navy-hopsack-suit");
    await expect(
      page.getByRole("heading", { name: "Make it yours." }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "3D", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("suit-3d-canvas")).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Interactive 3D suit preview" }),
    ).toHaveAttribute("data-view", "Back");
    await page.getByRole("button", { name: "Front", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Customization steps" })
      .getByRole("button", { name: "Details", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Trousers", exact: true })
      .last()
      .click();
    await page
      .getByLabel("Waist treatment", { exact: true })
      .selectOption("belt-loops");
    await page
      .getByLabel("Trouser front", { exact: true })
      .selectOption("double");
    await page
      .getByLabel("Brace buttons", { exact: true })
      .selectOption("inside");
    await page
      .getByLabel("Pleat direction", { exact: true })
      .selectOption("forward");
    await expect(
      page.getByLabel("Waist treatment", { exact: true }),
    ).toHaveValue("belt-loops");
    await page
      .getByLabel("Trouser front", { exact: true })
      .selectOption("flat");
    await expect(
      page.getByLabel("Pleat direction", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Pleat direction", { exact: true }),
    ).toHaveValue("");
    await page
      .getByLabel("Trouser front", { exact: true })
      .selectOption("double");

    await page.getByRole("button", { name: "Waistcoat", exact: true }).click();
    await page
      .getByLabel("Include waistcoat", { exact: true })
      .selectOption("yes");
    await page
      .getByLabel("Waistcoat back", { exact: true })
      .selectOption("self");
    await page.getByRole("button", { name: "Dimensions", exact: true }).click();
    await page
      .getByLabel("Inseam in centimetres", { exact: true })
      .fill("80.5");
    await page.getByRole("tab", { name: "3D", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Interactive 3D suit preview" }),
    ).toBeVisible();
    await expect(
      page.getByText("Preparing your suit", { exact: true }),
    ).toHaveCount(0, { timeout: 15000 });
    await expect(
      page.getByText(/Construction and measurement requests/),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download specification" }).click();
    const download = await downloadPromise;
    const data = JSON.parse(await readFile((await download.path())!, "utf8"));
    expect(data.makerStatus).toBe("unconfirmed");
    expect(data.pricingStatus).toBe("quote-required");
    expect(data.configuration.tailoring.choices).toMatchObject({
      "waist-treatment": "belt-loops",
      pleats: "double",
      "brace-buttons": "inside",
      "waistcoat-back": "self",
    });
    expect(data.configuration.tailoring.dimensions["inseam-cm"]).toBe(80.5);
    expect(
      data.configuration.tailoring.choices["pleat-direction"],
    ).toBeUndefined();

    await page
      .getByRole("navigation", { name: "Customization steps" })
      .getByRole("button", { name: "Review", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Maker quote required", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("region", { name: "Tailoring requests" }),
    ).toContainText("80.5 cm");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (viewport.name === "desktop") {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
