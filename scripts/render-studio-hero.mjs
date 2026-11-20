import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);

const base = process.env.HERO_BASE_URL ?? "http://127.0.0.1:3000";
const output = path.join(process.cwd(), "public/images");
const SHOTS = [
  { scheme: "light", file: "studio-suit.webp" },
  { scheme: "dark", file: "studio-suit-dark.webp" },
];
const CROP = { left: 100, top: 200, width: 1800, height: 2280 };

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
try {
  for (const { scheme, file } of SHOTS) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1300 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    });
    await page.goto(`${base}/studio/house-navy-hopsack-suit`, {
      timeout: 120_000,
    });
    await page
      .getByRole("region", { name: "Full-screen 3D suit studio" })
      .and(page.locator('[data-ready="true"]'))
      .waitFor({ timeout: 120_000 });
    await page.getByRole("button", { name: "Hide options" }).click();
    await page.addStyleTag({
      content:
        ".atelier-bar,.atelier-tools,.atelier-tooltip,.atelier-hint,nextjs-portal{display:none!important}",
    });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(4000);
    const png = await page.screenshot();
    await sharp(png)
      .extract(CROP)
      .resize({ width: 1200 })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(output, file));
    console.log(`${file} (${scheme})`);
    await page.close();
  }
} finally {
  await browser.close();
}
