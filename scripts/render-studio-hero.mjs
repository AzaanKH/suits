// Renders the home page hero from the real 3D studio, once per theme:
//   public/images/studio-suit.webp       (light theme, atelier lighting)
//   public/images/studio-suit-dark.webp  (dark theme, evening lighting)
//
// Run it whenever the model, materials, lighting or default suit change, with
// the app running (`pnpm dev` or `pnpm build && pnpm start`):
//
//   pnpm assets:hero                       # http://127.0.0.1:3000
//   HERO_BASE_URL=http://localhost:3001 pnpm assets:hero
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
// The suit and podium inside a 1000×1300 viewport at 2× (2000×2600 pixels).
const CROP = { left: 100, top: 200, width: 1800, height: 2280 };

const browser = await chromium.launch({
  // Headless Chromium needs a software GL backend for WebGL.
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
    // Only the scene: no studio chrome, no Next.js dev indicator.
    await page.addStyleTag({
      content:
        ".atelier-bar,.atelier-tools,.atelier-tooltip,.atelier-hint,nextjs-portal{display:none!important}",
    });
    await page.mouse.move(2, 2); // no hover outline
    await page.waitForTimeout(4000); // camera settle, shadows, AO
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
