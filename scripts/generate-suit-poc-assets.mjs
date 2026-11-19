import { accessSync, constants } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const generatorPath = path.join(repoRoot, "scripts/generate-suit-blender-assets.py");
const blenderBin = findBlender();

const result = spawnSync(
  blenderBin,
  ["--background", "--python", generatorPath],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);

function findBlender() {
  const candidates = [
    process.env.BLENDER_BIN,
    "blender",
    "/opt/homebrew/bin/blender",
    "/usr/local/bin/blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "blender") {
      const result = spawnSync("blender", ["--version"], {
        stdio: "ignore",
      });

      if (result.status === 0) {
        return candidate;
      }

      continue;
    }

    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next common install location.
    }
  }

  throw new Error(
    "Blender was not found. Install Blender or set BLENDER_BIN to the Blender executable.",
  );
}
