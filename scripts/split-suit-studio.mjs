// Splits the Blender export into one GLB per jacket block so the browser only
// downloads the block it shows. Run after `pnpm assets:studio:build`.
//
//   core   — shared meshes (trousers, waistcoat, pleats, waist details) + the
//            single-breasted block, which is the default selection
//   double — the double-breasted block
//   dinner — the shawl-lapel dinner jacket block
//
// Mesh names are the runtime contract (see docs/3d-suit-configurator.md).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  cloneDocument,
  dedup,
  meshopt,
  prune,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "assets/suit-studio/arden-tailoring.glb");
const output = path.join(root, "public/models/suit-studio");

// A shawl lapel always selects the dinner block, so these never render.
const UNREACHABLE = new Set(["single_lapel_shawl", "double_lapel_shawl"]);

const BUNDLES = {
  core: (name) => !/^(double|dinner)_/.test(name),
  double: (name) => name.startsWith("double_"),
  dinner: (name) => name.startsWith("dinner_"),
};

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.read(source);
await mkdir(output, { recursive: true });

for (const [bundle, keep] of Object.entries(BUNDLES)) {
  const doc = cloneDocument(document);
  let triangles = 0;
  const kept = [];
  for (const node of doc.getRoot().listNodes()) {
    const name = node.getName();
    if (!node.getMesh()) continue;
    if (!keep(name) || UNREACHABLE.has(name)) {
      node.dispose();
      continue;
    }
    kept.push(name);
    for (const primitive of node.getMesh().listPrimitives())
      triangles += (primitive.getIndices()?.getCount() ?? 0) / 3;
  }
  await doc.transform(
    prune(),
    dedup(),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  const file = path.join(output, `suit-${bundle}.glb`);
  await io.write(file, doc);
  const { size } = await stat(file);
  console.log(
    `suit-${bundle}.glb: ${kept.length} meshes, ${triangles.toLocaleString()} triangles, ${Math.round(size / 1024)} KB`,
  );
}
