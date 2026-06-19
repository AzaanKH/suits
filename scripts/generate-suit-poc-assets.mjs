import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

if (!globalThis.FileReader) {
  globalThis.FileReader = class NodeFileReader {
    result = null;
    onloadend = null;

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.({ target: this });
    }

    async readAsDataURL(blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type};base64,${buffer.toString("base64")}`;
      this.onloadend?.({ target: this });
    }
  };
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const assetRoot = path.join(repoRoot, "public/models/suit-configurator");

const neutralFabric = new THREE.MeshStandardMaterial({
  name: "Fabric_OverrideSlot",
  color: "#25314d",
  roughness: 0.82,
});
const mannequinMaterial = new THREE.MeshStandardMaterial({
  name: "Mannequin_MatteWarmGrey",
  color: "#d2cbc1",
  roughness: 0.86,
});
const standMaterial = new THREE.MeshStandardMaterial({
  name: "Mannequin_StandBrushedSteel",
  color: "#8d8880",
  metalness: 0.12,
  roughness: 0.5,
});
const buttonMaterial = new THREE.MeshStandardMaterial({
  name: "Button_OverrideSlot",
  color: "#211713",
  roughness: 0.42,
});

const exports = [
  ["base/mannequin.glb", createMannequin()],
  [
    "jackets/single-breasted-two-button.glb",
    createJacket("single-breasted-two-button"),
  ],
  [
    "jackets/single-breasted-one-button.glb",
    createJacket("single-breasted-one-button"),
  ],
  [
    "jackets/double-breasted-six-button.glb",
    createJacket("double-breasted-six-button"),
  ],
  ["lapels/notch-lapel.glb", createLapels("notch-lapel")],
  ["lapels/peak-lapel.glb", createLapels("peak-lapel")],
  ["lapels/shawl-lapel.glb", createLapels("shawl-lapel")],
  ["buttons/horn-buttons.glb", createButtons("horn-buttons")],
  ["buttons/smoked-pearl-buttons.glb", createButtons("smoked-pearl-buttons")],
  ["buttons/covered-buttons.glb", createButtons("covered-buttons")],
];

await mkdir(assetRoot, { recursive: true });

for (const [relativePath, scene] of exports) {
  const outputPath = path.join(assetRoot, relativePath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeGlb(scene, outputPath);
}

async function writeGlb(scene, outputPath) {
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    includeCustomExtensions: false,
  });

  await writeFile(outputPath, Buffer.from(arrayBuffer));
}

function createMannequin() {
  const group = new THREE.Group();
  group.name = "HouseSuit_Base_Mannequin";

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.18, 6, 18),
    mannequinMaterial,
  );
  torso.name = "Mannequin_Base";
  torso.position.set(0, 0.98, -0.02);
  torso.scale.set(0.72, 1, 0.5);
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 16),
    mannequinMaterial,
  );
  head.name = "Mannequin_Head";
  head.position.set(0, 1.92, -0.02);
  group.add(head);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.2, 18),
    mannequinMaterial,
  );
  neck.name = "Mannequin_Neck";
  neck.position.set(0, 1.72, -0.02);
  group.add(neck);

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.05, 36),
    standMaterial,
  );
  stand.name = "Mannequin_Stand";
  stand.position.set(0, 0.04, -0.03);
  group.add(stand);

  return group;
}

function createJacket(code) {
  const group = new THREE.Group();
  const nameSuffix = toPascalCase(code);
  group.name = `Jacket_${nameSuffix}_Root`;

  const isDoubleBreasted = code === "double-breasted-six-button";
  const isEvening = code === "single-breasted-one-button";
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(
      isDoubleBreasted ? 0.94 : 0.82,
      isEvening ? 1.1 : 1.18,
      0.26,
      2,
      3,
      1,
    ),
    neutralFabric,
  );
  body.name = `Jacket_${nameSuffix}`;
  body.position.set(0, isEvening ? 0.98 : 1.02, 0.08);
  body.scale.set(1, 1, 0.92);
  group.add(body);

  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(isDoubleBreasted ? 1.22 : 1.12, 0.16, 0.28),
    neutralFabric,
  );
  shoulder.name = `Shoulder_${nameSuffix}`;
  shoulder.position.set(0, 1.64, 0.08);
  group.add(shoulder);

  const leftSleeve = createSleeve(`Sleeve_Left_${nameSuffix}`, -0.68);
  const rightSleeve = createSleeve(`Sleeve_Right_${nameSuffix}`, 0.68);
  group.add(leftSleeve, rightSleeve);

  if (isDoubleBreasted) {
    const overlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.98, 0.035),
      neutralFabric,
    );
    overlap.name = `Jacket_Overlap_${nameSuffix}`;
    overlap.position.set(0.16, 1.04, 0.23);
    overlap.rotation.z = -0.04;
    group.add(overlap);
  } else {
    const frontEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.98, 0.032),
      neutralFabric,
    );
    frontEdge.name = `Jacket_FrontEdge_${nameSuffix}`;
    frontEdge.position.set(0, 1.04, 0.235);
    group.add(frontEdge);
  }

  return group;
}

function createSleeve(name, x) {
  const sleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.105, 0.94, 6, 14),
    neutralFabric,
  );
  sleeve.name = name;
  sleeve.position.set(x, 0.96, 0.055);
  sleeve.rotation.z = x > 0 ? -0.13 : 0.13;
  sleeve.scale.set(0.86, 1, 0.7);

  return sleeve;
}

function createLapels(code) {
  const group = new THREE.Group();
  const style = code.replace("-lapel", "");
  const nameSuffix = toPascalCase(style);
  group.name = `Lapel_${nameSuffix}_Root`;

  if (style === "shawl") {
    const left = createShawlLapel(`Lapel_Left_${nameSuffix}`, -1);
    const right = createShawlLapel(`Lapel_Right_${nameSuffix}`, 1);
    group.add(left, right);
    return group;
  }

  const lapelHeight = style === "peak" ? 0.74 : 0.62;
  const shoulderY = style === "peak" ? 1.62 : 1.5;
  const outerX = style === "peak" ? 0.32 : 0.25;
  const left = createTriangularLapel(
    `Lapel_Left_${nameSuffix}`,
    -1,
    lapelHeight,
    shoulderY,
    outerX,
  );
  const right = createTriangularLapel(
    `Lapel_Right_${nameSuffix}`,
    1,
    lapelHeight,
    shoulderY,
    outerX,
  );
  group.add(left, right);

  return group;
}

function createTriangularLapel(name, side, lapelHeight, shoulderY, outerX) {
  const geometry = new THREE.BufferGeometry();
  const innerX = 0.04 * side;
  const signedOuterX = outerX * side;
  const signedLowerX = 0.2 * side;
  const vertices = new Float32Array([
    innerX,
    shoulderY,
    0.255,
    signedOuterX,
    shoulderY - 0.1,
    0.27,
    signedLowerX,
    shoulderY - lapelHeight,
    0.285,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, side > 0 ? 1 : 2, side > 0 ? 2 : 1]);
  geometry.computeVertexNormals();

  const lapel = new THREE.Mesh(geometry, neutralFabric);
  lapel.name = name;

  return lapel;
}

function createShawlLapel(name, side) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05 * side, 1.58, 0.28),
    new THREE.Vector3(0.22 * side, 1.33, 0.3),
    new THREE.Vector3(0.16 * side, 1.06, 0.31),
    new THREE.Vector3(0.05 * side, 0.8, 0.29),
  ]);
  const geometry = new THREE.TubeGeometry(curve, 20, 0.035, 8, false);
  const lapel = new THREE.Mesh(geometry, neutralFabric);
  lapel.name = name;

  return lapel;
}

function createButtons(code) {
  const group = new THREE.Group();
  const nameSuffix =
    code === "smoked-pearl-buttons"
      ? "SmokedPearl"
      : code === "covered-buttons"
        ? "Covered"
        : "Horn";
  group.name = `Buttons_${nameSuffix}_Root`;

  const positions =
    code === "covered-buttons"
      ? [
          [0, 1.12, 0.315],
          [0, 0.9, 0.315],
        ]
      : code === "smoked-pearl-buttons"
        ? [
            [0, 1.16, 0.315],
            [0, 0.95, 0.315],
          ]
        : [
            [0, 1.17, 0.315],
            [0, 0.96, 0.315],
          ];

  if (code === "covered-buttons") {
    positions.push([-0.2, 1.24, 0.31], [0.2, 1.02, 0.31]);
  }

  for (const [index, position] of positions.entries()) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.014, 20),
      buttonMaterial,
    );
    button.name = `${group.name.replace("_Root", "")}_${index + 1}`;
    button.rotation.x = Math.PI / 2;
    button.position.set(position[0], position[1], position[2]);
    group.add(button);
  }

  const mergedGroup = new THREE.Group();
  mergedGroup.name = group.name;
  const holder = new THREE.Group();
  holder.name = group.name.replace("_Root", "");
  holder.add(...group.children);
  mergedGroup.add(holder);

  return mergedGroup;
}

function toPascalCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
