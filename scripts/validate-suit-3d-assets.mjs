import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifestPath = path.join(
  repoRoot,
  "src/features/customizer/three-d/asset-manifest.json",
);
const publicRoot = path.join(repoRoot, "public/models/suit-configurator");
const sourceRoot = path.join(repoRoot, "assets/suit-configurator/blender");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const slotMaterialNames = {
  fabric: "Fabric_OverrideSlot",
  button: "Button_OverrideSlot",
  lining: "Lining_OverrideSlot",
};

const assets = flattenManifest(manifest);
const failures = [];
let totalBytes = 0;

for (const asset of assets) {
  const glbPath = path.join(publicRoot, asset.path);
  const sourcePath = path.join(sourceRoot, asset.path.replace(/\.glb$/, ".blend"));

  checkFile(sourcePath, `${asset.code} source .blend`, failures);
  const glbStats = checkFile(glbPath, `${asset.code} exported .glb`, failures);

  if (!glbStats) {
    continue;
  }

  totalBytes += glbStats.size;

  const gltf = parseGlb(glbPath);
  const nodeNames = new Set(
    (gltf.nodes ?? []).map((node) => node.name).filter(Boolean),
  );

  if (!nodeNames.has(asset.rootNodeName)) {
    failures.push(
      `${asset.path}: missing root node ${JSON.stringify(asset.rootNodeName)}`,
    );
  }

  for (const meshName of asset.meshNames) {
    if (!nodeNames.has(meshName)) {
      failures.push(`${asset.path}: missing mesh node ${JSON.stringify(meshName)}`);
    }
  }

  for (const [slotName, meshNames] of Object.entries(asset.materialSlots ?? {})) {
    const expectedMaterial = slotMaterialNames[slotName];

    for (const meshName of meshNames) {
      const materialNames = getNodeMaterialNames(gltf, meshName);

      if (materialNames.length === 0) {
        failures.push(`${asset.path}: ${meshName} has no exported material`);
        continue;
      }

      if (!materialNames.includes(expectedMaterial)) {
        failures.push(
          `${asset.path}: ${meshName} expected ${expectedMaterial}, found ${materialNames.join(", ")}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("3D asset validation failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(
  `Validated ${assets.length} modular 3D assets (${formatBytes(totalBytes)} total).`,
);

function flattenManifest(value) {
  return [
    value.base,
    ...Object.values(value.jackets),
    ...Object.values(value.lapels),
    ...Object.values(value.buttons),
    ...Object.values(value.pockets),
    ...Object.values(value.trousers),
    ...Object.values(value.vests),
  ];
}

function checkFile(filePath, label, failures) {
  try {
    const stats = statSync(filePath);

    if (stats.size <= 0) {
      failures.push(`${label} is empty at ${path.relative(repoRoot, filePath)}`);
      return null;
    }

    return stats;
  } catch {
    failures.push(`${label} is missing at ${path.relative(repoRoot, filePath)}`);
    return null;
  }
}

function parseGlb(filePath) {
  const buffer = readFileSync(filePath);
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);

  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error(`${path.relative(repoRoot, filePath)} is not a GLB v2 file.`);
  }

  let offset = 12;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString("utf8", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === "JSON") {
      return JSON.parse(buffer.subarray(chunkStart, chunkEnd).toString("utf8"));
    }

    offset = chunkEnd;
  }

  throw new Error(`${path.relative(repoRoot, filePath)} does not contain JSON.`);
}

function getNodeMaterialNames(gltf, nodeName) {
  const node = (gltf.nodes ?? []).find((candidate) => candidate.name === nodeName);

  if (!node || typeof node.mesh !== "number") {
    return [];
  }

  const mesh = gltf.meshes?.[node.mesh];

  return Array.from(
    new Set(
      (mesh?.primitives ?? [])
        .map((primitive) => gltf.materials?.[primitive.material]?.name)
        .filter(Boolean),
    ),
  );
}

function formatBytes(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}
