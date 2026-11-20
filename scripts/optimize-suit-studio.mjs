import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);
const root = process.cwd();
const output = path.join(root, "public/models/suit-studio/textures");
await mkdir(output, { recursive: true });
const maps = [
  ["assets/suit-studio/source/NewSuit3-norm.png", "single-normal.webp"],
  ["assets/suit-studio/source/double/DB-suit-norm.png", "double-normal.webp"],
  [
    "assets/suit-studio/source/dinner/SuitDinnerJacket-norm.png",
    "dinner-normal.webp",
  ],
  ["assets/suit-studio/source/wool-albedo.png", "wool-albedo.webp"],
];
for (const [source, target] of maps) {
  const result = await sharp(path.join(root, source))
    .resize({
      width: 1536,
      height: 1536,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 95, effort: 6 })
    .toFile(path.join(output, target));
  console.log(`${target}: ${Math.round(result.size / 1024)} KB`);
}
