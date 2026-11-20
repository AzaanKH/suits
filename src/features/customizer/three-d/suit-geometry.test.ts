// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Triangle,
  Vector3,
} from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { beforeAll, describe, expect, it } from "vitest";

const MODELS = path.resolve(__dirname, "../../../../public/models/suit-studio");
const BLOCKS = ["single", "double", "dinner"] as const;
type Block = (typeof BLOCKS)[number];
const FILE: Record<Block, string> = {
  single: "suit-core.glb",
  double: "suit-double.glb",
  dinner: "suit-dinner.glb",
};
const POCKET_STYLES = ["flap", "slanted", "welt", "patch"] as const;

const material = new MeshBasicMaterial({ side: DoubleSide });
const meshes = new Map<string, Mesh>();

async function load(file: string) {
  const bytes = readFileSync(path.join(MODELS, file));
  if (bytes.subarray(0, 40).toString().startsWith("version https://git-lfs"))
    throw new Error(
      `${file} is a Git LFS pointer. Run \`git lfs pull\` (CI: checkout with lfs: true).`,
    );
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.readBinary(new Uint8Array(bytes));
  for (const node of doc.getRoot().listNodes()) {
    const source = node.getMesh();
    if (!source) continue;
    const world = new Matrix4().fromArray(node.getWorldMatrix());
    for (const primitive of source.listPrimitives()) {
      const position = primitive.getAttribute("POSITION")!;
      const vertices = new Float32Array(position.getCount() * 3);
      const element: number[] = [];
      for (let i = 0; i < position.getCount(); i++) {
        position.getElement(i, element);
        vertices.set(element, i * 3);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(vertices, 3));
      const indices = primitive.getIndices();
      if (indices)
        geometry.setIndex(Array.from(indices.getArray() as ArrayLike<number>));
      geometry.applyMatrix4(world);
      geometry.boundsTree = new MeshBVH(geometry);
      const mesh = new Mesh(geometry, material);
      mesh.raycast = acceleratedRaycast;
      mesh.name = node.getName();
      meshes.set(mesh.name, mesh);
    }
  }
}

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const BACK = new Vector3(0, 0, -1);

function frontHit(mesh: Mesh, x: number, y: number) {
  raycaster.set(new Vector3(x, y, 2), BACK);
  return raycaster.intersectObject(mesh)[0] ?? null;
}

function frontZ(mesh: Mesh, x: number, y: number): number | null {
  return frontHit(mesh, x, y)?.point.z ?? null;
}

function positions(mesh: Mesh) {
  const attribute = mesh.geometry.getAttribute("position");
  return Array.from({ length: attribute.count }, (_, i) =>
    new Vector3().fromBufferAttribute(attribute, i),
  );
}

function gap(part: Mesh, surface: Mesh) {
  const tree = surface.geometry.boundsTree!;
  return Math.min(
    ...positions(part).map((p) => tree.closestPointToPoint(p)!.distance),
  );
}

function footprint(mesh: Mesh, side: 1 | -1, inset = 0.1, steps = 16) {
  const pts = positions(mesh).filter((p) => p.x * side > 0);
  const [x0, x1] = [
    Math.min(...pts.map((p) => p.x)),
    Math.max(...pts.map((p) => p.x)),
  ];
  const [y0, y1] = [
    Math.min(...pts.map((p) => p.y)),
    Math.max(...pts.map((p) => p.y)),
  ];
  const [ix, iy] = [(x1 - x0) * inset, (y1 - y0) * inset];
  const grid: [number, number][] = [];
  for (let i = 0; i <= steps; i++)
    for (let j = 0; j <= steps; j++)
      grid.push([
        x0 + ix + ((x1 - x0 - 2 * ix) * i) / steps,
        y0 + iy + ((y1 - y0 - 2 * iy) * j) / steps,
      ]);
  return grid;
}

const get = (name: string) => {
  const mesh = meshes.get(name);
  if (!mesh) throw new Error(`Missing mesh ${name}`);
  return mesh;
};

beforeAll(async () => {
  for (const block of BLOCKS) await load(FILE[block]);
}, 120_000);

describe("studio model geometry", () => {
  it.each(BLOCKS)("%s jacket buttons touch the cloth", (block) => {
    const body = get(`${block}_body`);
    const buttons = [...meshes.values()].filter((m) =>
      new RegExp(`^${block}_button_`).test(m.name),
    );
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(gap(button, body), button.name).toBeLessThan(0.0015);
      const c = positions(button)
        .reduce((a, p) => a.add(p), new Vector3())
        .divideScalar(positions(button).length);
      const near = body.geometry.boundsTree!.closestPointToPoint(c)!;
      const normal = new Triangle()
        .setFromAttributeAndIndices(
          body.geometry.getAttribute("position") as BufferAttribute,
          ...([0, 1, 2].map((k) =>
            body.geometry.index!.getX(near.faceIndex * 3 + k),
          ) as [number, number, number]),
        )
        .getNormal(new Vector3());
      const outward = new Vector3(near.point.x, 0, near.point.z - 0.02);
      if (normal.dot(outward) < 0) normal.negate();
      expect(
        c.clone().sub(near.point).dot(normal),
        `${button.name} buried`,
      ).toBeGreaterThan(-0.0005);
    }
  });

  it("shirt buttons touch the shirt", () => {
    const shirt = get("single_shirt_7");
    for (const name of ["shirt_button_0", "shirt_button_1", "shirt_button_2"])
      expect(gap(get(name), shirt), name).toBeLessThan(0.001);
  });

  it.each(BLOCKS)(
    "%s hip-pocket openings are closed (no see-through to the back)",
    (block) => {
      const body = get(`${block}_body`);
      const flap = get(`${block}_pocket_flap`);
      for (const side of [1, -1] as const) {
        const through = footprint(flap, side).filter(([x, y]) => {
          const hit = frontHit(body, x, y);
          return hit !== null && hit.face!.normal.dot(BACK) > 0;
        });
        expect(through, `${block} side ${side}`).toEqual([]);
      }
    },
  );

  it.each(BLOCKS)(
    "%s cloth around the hip pockets is smooth (no bulge or dip)",
    (block) => {
      const body = get(`${block}_body`);
      const flap = get(`${block}_pocket_flap`);
      for (const side of [1, -1] as const) {
        const pts = positions(flap).filter((p) => p.x * side > 0);
        const [x0, x1] = [
          Math.min(...pts.map((p) => p.x)),
          Math.max(...pts.map((p) => p.x)),
        ];
        const [y0, y1] = [
          Math.min(...pts.map((p) => p.y)),
          Math.max(...pts.map((p) => p.y)),
        ];
        const samples: [number, number, number][] = [];
        for (let i = 0; i <= 20; i++)
          for (let j = 0; j <= 20; j++) {
            const x = x0 + 0.005 + ((x1 - x0 - 0.01) * i) / 20;
            const y = y0 - 0.02 + ((y1 - y0 + 0.04) * j) / 20;
            const hit = frontHit(body, x, y);
            if (hit && hit.face!.normal.z > 0.6)
              samples.push([x, y, hit.point.z]);
          }
        const terms = (x: number, y: number) => [1, x, y, x * x, x * y, y * y];
        const n = 6;
        const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
        for (const [x, y, z] of samples) {
          const t = terms(x, y);
          for (let r = 0; r < n; r++) {
            A[r][n] += t[r] * z;
            for (let c = 0; c < n; c++) A[r][c] += t[r] * t[c];
          }
        }
        for (let c = 0; c < n; c++) {
          let p = c;
          for (let r = c + 1; r < n; r++)
            if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
          [A[c], A[p]] = [A[p], A[c]];
          for (let r = 0; r < n; r++)
            if (r !== c) {
              const k = A[r][c] / A[c][c];
              for (let q = c; q <= n; q++) A[r][q] -= k * A[c][q];
            }
        }
        const k = A.map((row, r) => row[n] / row[r]);
        const worst = Math.max(
          ...samples.map(([x, y, z]) =>
            Math.abs(z - terms(x, y).reduce((a, t, r) => a + t * k[r], 0)),
          ),
        );
        expect(samples.length, `${block} side ${side}`).toBeGreaterThan(200);
        if (process.env.GEOMETRY_DEBUG)
          console.log(
            `smooth ${block} ${side} worst=${(worst * 1000).toFixed(2)}mm n=${samples.length}`,
          );
        expect(
          worst,
          `${block} side ${side}: worst deviation (m)`,
        ).toBeLessThan(0.012);
      }
    },
  );

  for (const block of BLOCKS)
    it.each(POCKET_STYLES)(
      `${block} %s pockets sit on the cloth, in front and not floating`,
      (style) => {
        const body = get(`${block}_body`);
        const pocket = meshes.get(`${block}_pocket_${style}`);
        if (!pocket) return;
        for (const side of [1, -1] as const) {
          let samples = 0;
          let sunk = 0;
          let floating = 0;
          const tree = body.geometry.boundsTree!;
          for (const [x, y] of footprint(pocket, side)) {
            const hit = frontHit(pocket, x, y);
            const bz = frontZ(body, x, y);
            if (hit === null || bz === null) continue;
            const pz = hit.point.z;
            if (pz < bz - 0.005) continue;
            samples++;
            if (pz < bz + 0.0002) {
              sunk++;
              if (process.env.GEOMETRY_DEBUG)
                console.log(
                  `sunk ${block}_${style} ${side} x=${x.toFixed(3)} y=${y.toFixed(3)} ${((pz - bz) * 1000).toFixed(2)}mm`,
                );
            }
            const off = tree.closestPointToPoint(hit.point)!.distance;
            if (off > 0.008) {
              floating++;
              if (process.env.GEOMETRY_DEBUG)
                console.log(
                  `floating ${block}_${style} ${side} x=${x.toFixed(3)} y=${y.toFixed(3)} ${(off * 1000).toFixed(1)}mm pz-bz=${((pz - bz) * 1000).toFixed(1)}`,
                );
            }
          }
          const label = `${block}_pocket_${style} side ${side}`;
          expect(samples, label).toBeGreaterThan(20);
          const middle = footprint(pocket, side, 0.2);
          const covered = middle.filter(
            ([x, y]) => frontHit(pocket, x, y) !== null,
          ).length;
          expect(covered / middle.length, `${label}: coverage`).toBeGreaterThan(
            style === "slanted" ? 0.8 : 0.97,
          );
          expect(sunk / samples, `${label}: sunk`).toBeLessThan(0.03);
          expect(floating / samples, `${label}: floating`).toBeLessThan(0.03);
        }
      },
    );
});
