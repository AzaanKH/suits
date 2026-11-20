"use client";

import { createPortal, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  Outlines,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  Component,
  Fragment,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  Plane,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Group,
  type Intersection,
  type Object3D,
  type Texture,
} from "three";

import {
  getSuitBlock,
  isSuitMeshVisible,
  type Suit3dMaterial,
  type Suit3dSelection,
  type SuitBlock,
} from "./suit-selection";
import { getSuitPartForMesh, type SuitPart } from "./suit-parts";

BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const ASSET_VERSION = "?v=7";
const MODELS = "/models/suit-studio/";
const TEXTURES = MODELS + "textures/";

export const SUIT_CORE_URL = `${MODELS}suit-core.glb${ASSET_VERSION}`;
const CORE_TEXTURE_URLS = [
  `${TEXTURES}wool-albedo.webp${ASSET_VERSION}`,
  `${TEXTURES}single-normal.webp${ASSET_VERSION}`,
];
const BLOCK_ASSETS: Record<
  Exclude<SuitBlock, "single">,
  { model: string; normal: string }
> = {
  double: {
    model: `${MODELS}suit-double.glb${ASSET_VERSION}`,
    normal: `${TEXTURES}double-normal.webp${ASSET_VERSION}`,
  },
  dinner: {
    model: `${MODELS}suit-dinner.glb${ASSET_VERSION}`,
    normal: `${TEXTURES}dinner-normal.webp${ASSET_VERSION}`,
  },
};

export function preloadSuitBlocks() {
  for (const { model, normal } of Object.values(BLOCK_ASSETS)) {
    useGLTF.preload(model);
    useTexture.preload(normal);
  }
}

function clearSuitAssets() {
  useGLTF.clear(SUIT_CORE_URL);
  useTexture.clear(CORE_TEXTURE_URLS);
  for (const { model, normal } of Object.values(BLOCK_ASSETS)) {
    useGLTF.clear(model);
    useTexture.clear(normal);
  }
}

const HIDDEN_LAYER = 31;

export type SuitMood = "daylight" | "atelier" | "evening";

export const SUIT_MOODS: Record<
  SuitMood,
  {
    label: string;
    background: string;
    key: string;
    fill: string;
    exposure: number;
    shadow: string;
  }
> = {
  daylight: {
    label: "Daylight",
    background: "#eef0f1",
    key: "#ffffff",
    fill: "#e5edff",
    exposure: 1.25,
    shadow: "#526070",
  },
  atelier: {
    label: "Atelier",
    background: "#f3f3ef",
    key: "#fff6ea",
    fill: "#eceee8",
    exposure: 1.2,
    shadow: "#3d4350",
  },
  evening: {
    label: "Evening",
    background: "#14171b",
    key: "#dfe7ff",
    fill: "#ffcf9a",
    exposure: 1.05,
    shadow: "#000000",
  },
};

type TailoredSuitProps = {
  selection: Suit3dSelection;
  onReady?: () => void;
  onModel?: (model: Group) => void;
  interaction?: {
    hoveredStep: SuitPart["step"] | null;
    onHover: (part: SuitPart | null, event: ThreeEvent<PointerEvent>) => void;
    onSelect: (part: SuitPart) => void;
  };
  preloadBlocks?: boolean;
  trousersOnly?: boolean;
  insideView?: boolean;
};

const INSIDE_CLIP = [new Plane(new Vector3(0, 0, 1), -0.02)];

function isInsideViewMesh(name: string) {
  return (
    /^(single|double|dinner)_/.test(name) &&
    !/_(shirt|cuff|pocket_|ticket_)|_breast$/.test(name)
  );
}

type SuitMaterials = Record<string, MeshPhysicalMaterial>;

export function TailoredSuit({
  selection,
  onReady,
  onModel,
  interaction,
  preloadBlocks = false,
  trousersOnly = false,
  insideView = false,
}: TailoredSuitProps) {
  const shown = useDeferredValue(selection);
  const block = getSuitBlock(shown);
  const { scene } = useGLTF(SUIT_CORE_URL);
  const [woolSource, normalSource] = useTexture(CORE_TEXTURE_URLS);
  const invalidate = useThree((s) => s.invalidate);
  const groupRef = useRef<Group>(null);
  const core = useMemo(() => scene.clone(true), [scene]);
  const textures = useMemo(() => {
    const wool = woolSource.clone();
    wool.wrapS = wool.wrapT = RepeatWrapping;
    wool.repeat.set(36, 36);
    wool.colorSpace = SRGBColorSpace;
    wool.anisotropy = 8;
    wool.needsUpdate = true;
    return { wool, normal: toGltfNormal(normalSource) };
  }, [woolSource, normalSource]);
  const materials = useMemo(
    () => createMaterials(textures.wool, textures.normal),
    [textures],
  );

  useLayoutEffect(() => {
    if (groupRef.current) onModel?.(groupRef.current);
  }, [onModel]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    applySelectionToMaterials(materials, shown);
    group.traverse((object) => {
      if (!(object instanceof Mesh) || !object.name) return;
      if (object.userData.hitProxy) {
        object.layers.mask = object.parent!.layers.mask;
        return;
      }
      object.visible =
        isSuitMeshVisible(object.name, shown) &&
        (!trousersOnly ||
          getSuitPartForMesh(object.name)?.step === "trousers") &&
        (!insideView || isInsideViewMesh(object.name));
      object.layers.set(object.visible ? 0 : HIDDEN_LAYER);
      object.userData.slot ??= (
        Array.isArray(object.material) ? object.material[0] : object.material
      ).name;
      const slot = object.userData.slot as string;
      const variant = object.name.startsWith("dinner_")
        ? "Dinner"
        : object.name.startsWith("double_")
          ? "Double"
          : "";
      object.material = object.name.endsWith("_buttonhole")
        ? materials.Buttonhole
        : /_(pocket_(flap|patch|slanted|welt)|ticket_(flap|jetted)|inpocket_(chest_l|chest_r|pen|lower_l|lower_r))$/.test(
              object.name,
            )
          ? materials.PocketPanel
          : (materials[`${slot}${variant}`] ??
            materials[slot] ??
            materials.Cloth);
      object.castShadow = object.receiveShadow = true;
    });
    invalidate();
    onReady?.();
  }, [shown, block, materials, invalidate, onReady, trousersOnly, insideView]);

  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    get().gl.localClippingEnabled = true;
    showInside(materials, insideView);
    invalidate();
  }, [get, materials, insideView, invalidate]);

  useEffect(() => {
    if (!preloadBlocks) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    const timer = window.setTimeout(preloadSuitBlocks, 1500);
    return () => window.clearTimeout(timer);
  }, [preloadBlocks]);

  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  useEffect(
    () => () => Object.values(textures).forEach((t) => t.dispose()),
    [textures],
  );

  const hoveredStep = interaction?.hoveredStep ?? null;

  return (
    <group
      ref={groupRef}
      onPointerMove={
        interaction
          ? (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              interaction.onHover(partUnderPointer(event), event);
            }
          : undefined
      }
      onPointerOut={
        interaction
          ? (event: ThreeEvent<PointerEvent>) =>
              interaction.onHover(null, event)
          : undefined
      }
      onClick={
        interaction
          ? (event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              if (event.delta > 6) return;
              const part = partUnderPointer(event);
              if (part) interaction.onSelect(part);
            }
          : undefined
      }
    >
      <SuitPiece
        object={core}
        hoveredStep={hoveredStep}
        interactive={Boolean(interaction)}
        clipped={insideView}
      />
      {block === "double" ? (
        <mesh name="shirt_backing" position={[0, 1.378, 0.07]}>
          <planeGeometry args={[0.1, 0.155]} />
          <primitive object={materials.Shirt} attach="material" />
        </mesh>
      ) : null}
      {block === "single" ? null : (
        <SuitBlockModel
          block={block}
          materials={materials}
          hoveredStep={hoveredStep}
          interactive={Boolean(interaction)}
          clipped={insideView}
        />
      )}
    </group>
  );
}

function SuitBlockModel({
  block,
  materials,
  hoveredStep,
  interactive,
  clipped,
}: {
  block: Exclude<SuitBlock, "single">;
  materials: SuitMaterials;
  hoveredStep: SuitPart["step"] | null;
  interactive: boolean;
  clipped: boolean;
}) {
  const assets = BLOCK_ASSETS[block];
  const { scene } = useGLTF(assets.model);
  const normalSource = useTexture(assets.normal);
  const model = useMemo(() => scene.clone(true), [scene]);
  const normal = useMemo(() => toGltfNormal(normalSource), [normalSource]);
  useLayoutEffect(() => {
    setBlockNormal(materials, block, normal);
  }, [materials, block, normal]);
  useEffect(() => () => normal.dispose(), [normal]);
  return (
    <SuitPiece
      object={model}
      hoveredStep={hoveredStep}
      interactive={interactive}
      clipped={clipped}
    />
  );
}

function partUnderPointer(event: { intersections: { object: Object3D }[] }) {
  const hit = event.intersections.find((h) => h.object.name);
  return hit ? getSuitPartForMesh(hit.object.name) : null;
}

function clipAwareRaycast(base: Mesh["raycast"]): Mesh["raycast"] {
  return function (this: Mesh, raycaster, intersects) {
    const material = Array.isArray(this.material)
      ? this.material[0]
      : this.material;
    const planes = material?.clippingPlanes;
    if (!planes?.length) return base.call(this, raycaster, intersects);
    const firstHitOnly = raycaster.firstHitOnly;
    raycaster.firstHitOnly = false;
    const hits: Intersection[] = [];
    base.call(this, raycaster, hits);
    raycaster.firstHitOnly = firstHitOnly;
    const kept = hits
      .filter((hit) => planes.every((p) => p.distanceToPoint(hit.point) >= 0))
      .sort((a, b) => a.distance - b.distance);
    intersects.push(...(firstHitOnly ? kept.slice(0, 1) : kept));
  };
}

const HIT_PROXY_GEOMETRY = new SphereGeometry(1, 12, 8);

function SuitPiece({
  object,
  hoveredStep,
  interactive,
  clipped,
}: {
  object: Object3D;
  hoveredStep: SuitPart["step"] | null;
  interactive: boolean;
  clipped: boolean;
}) {
  const meshes = useMemo(() => {
    const list: Mesh[] = [];
    object.traverse((child) => {
      if (child instanceof Mesh) list.push(child);
    });
    return list;
  }, [object]);
  useEffect(() => {
    if (!interactive) return;
    const buttons: Mesh[] = [];
    object.traverse((child) => {
      if (!(child instanceof Mesh) || child.userData.hitProxy) return;
      const triangles = (child.geometry.index?.count ?? 0) / 3;
      if (!child.userData.clipAware) {
        child.userData.clipAware = true;
        if (triangles >= 20_000 && !child.geometry.boundsTree)
          child.geometry.computeBoundsTree();
        child.raycast = clipAwareRaycast(
          triangles >= 20_000 ? acceleratedRaycast : Mesh.prototype.raycast,
        );
      }
      if (getSuitPartForMesh(child.name)?.step === "buttons")
        buttons.push(child);
    });
    for (const button of buttons) {
      if (button.userData.hasHitProxy) continue;
      button.userData.hasHitProxy = true;
      button.geometry.computeBoundingSphere();
      const sphere = button.geometry.boundingSphere!;
      const proxy = new Mesh(HIT_PROXY_GEOMETRY);
      proxy.name = button.name;
      proxy.userData.hitProxy = true;
      proxy.visible = false;
      proxy.position.copy(sphere.center);
      proxy.scale.setScalar(Math.max(0.012, sphere.radius * 1.8));
      proxy.layers.mask = button.layers.mask;
      button.add(proxy);
    }
  }, [object, interactive]);
  const outlined = hoveredStep
    ? meshes.filter((m) => getSuitPartForMesh(m.name)?.step === hoveredStep)
    : [];
  return (
    <>
      <primitive object={object} dispose={null} />
      {outlined.map((mesh) => (
        <Fragment key={mesh.uuid}>
          {createPortal(
            <Outlines
              thickness={3}
              screenspace={false}
              angle={0}
              color="#4a6fd0"
              clippingPlanes={clipped ? INSIDE_CLIP : undefined}
            />,
            mesh,
          )}
        </Fragment>
      ))}
    </>
  );
}

function toGltfNormal(source: Texture) {
  const normal = source.clone();
  normal.flipY = false;
  normal.needsUpdate = true;
  return normal;
}

function setBlockNormal(
  materials: SuitMaterials,
  block: Exclude<SuitBlock, "single">,
  normal: Texture,
) {
  const variant = block === "double" ? "Double" : "Dinner";
  materials[`Cloth${variant}`].normalMap = normal;
  materials[`Lapel${variant}`].normalMap = normal;
}

export function SuitLighting({
  mood = "daylight",
  shadowResolution = 512,
  postProcessed = false,
}: {
  mood?: SuitMood;
  shadowResolution?: number;
  postProcessed?: boolean;
}) {
  const preset = SUIT_MOODS[mood];
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const { gl, invalidate } = get();
    gl.toneMappingExposure = preset.exposure;
    invalidate();
  }, [get, preset.exposure]);
  return (
    <>
      <color
        attach="background"
        args={[
          postProcessed
            ? untoneMapped(preset.background, preset.exposure)
            : preset.background,
        ]}
      />
      <ambientLight intensity={mood === "evening" ? 0.35 : 0.7} />
      <hemisphereLight args={["#ffffff", "#b9c2ce", 0.7]} />
      <directionalLight
        castShadow
        position={[-3, 4, 5]}
        intensity={2.8}
        color={preset.key}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1.5}
        shadow-camera-right={1.5}
        shadow-camera-top={2}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-normalBias={0.0015}
        shadow-bias={-0.00008}
      />
      <directionalLight
        position={[3, 2, -3]}
        intensity={mood === "evening" ? 2.6 : 1.9}
        color={preset.fill}
      />
      <Environment key={mood} resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={mood === "evening" ? 2 : 3.5}
          color={preset.key}
          position={[-3, 3, 3]}
          scale={[3, 5, 1]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color={preset.fill}
          position={[3, 1, 2]}
          scale={[2, 4, 1]}
          rotation={[0, -Math.PI / 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={4}
          position={[0, 4, -2]}
          scale={[4, 2, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Environment>
      {postProcessed ? null : (
        <ContactShadows
          key={`shadow-${mood}`}
          position={[0, 0.024, 0]}
          opacity={mood === "evening" ? 0.6 : 0.4}
          scale={2.8}
          blur={2.5}
          far={0.65}
          resolution={shadowResolution}
          frames={3}
          color={preset.shadow}
        />
      )}
    </>
  );
}

function untoneMapped(hex: string, exposure: number): Color {
  const target = new Color(hex);
  const y = multiply(ACES_OUTPUT_INVERSE, [target.r, target.g, target.b]);
  const z = y.map((v) => {
    const a = 1 - 0.983729 * v;
    const b = 0.0245786 - 0.432951 * v;
    const c = -(0.000090537 + 0.238081 * v);
    return Math.max(0, (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a));
  });
  const x = multiply(ACES_INPUT_INVERSE, z).map(
    (v) => (Math.max(0, v) * 0.6) / exposure,
  );
  return new Color(x[0], x[1], x[2]);
}

type Matrix = [number, number, number][];

function multiply(m: Matrix, v: number[]) {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

function invert3(m: Matrix): Matrix {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}

const ACES_INPUT_INVERSE = invert3([
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
]);
const ACES_OUTPUT_INVERSE = invert3([
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
]);

function createMaterials(wool: Texture, normal: Texture): SuitMaterials {
  const cloth = () =>
    new MeshPhysicalMaterial({
      map: wool,
      roughness: 0.88,
      normalMap: normal,
      normalScale: new Vector2(0.35, 0.35),
      metalness: 0,
      sheen: 0.35,
      sheenRoughness: 0.85,
      envMapIntensity: 0.65,
      side: DoubleSide,
    });
  const mats: SuitMaterials = {
    Cloth: cloth(),
    ClothDouble: cloth(),
    ClothDinner: cloth(),
    Lapel: cloth(),
    LapelDouble: cloth(),
    LapelDinner: cloth(),
    Trouser: cloth(),
    Waistcoat: cloth(),
    Shirt: new MeshPhysicalMaterial({
      color: "#eef0ed",
      roughness: 0.85,
      side: DoubleSide,
      sheen: 0.15,
    }),
    Button: new MeshPhysicalMaterial({
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    }),
    Lining: new MeshPhysicalMaterial({
      roughness: 0.45,
      sheen: 0.8,
      side: DoubleSide,
    }),
    Buttonhole: new MeshPhysicalMaterial({ roughness: 0.7, sheen: 0.3 }),
    Pocketing: new MeshPhysicalMaterial({ color: "#07080b", roughness: 0.9 }),
    PocketPanel: new MeshPhysicalMaterial({
      map: wool,
      roughness: 0.88,
      metalness: 0,
      sheen: 0.35,
      sheenRoughness: 0.85,
      envMapIntensity: 0.65,
      side: DoubleSide,
    }),
  };
  const interior = { value: INTERIOR_LIGHT };
  for (const [name, material] of Object.entries(mats)) {
    material.name = name;
    material.userData.interior = interior;
    if (material.side === DoubleSide)
      shadeInterior(material, interior, name.startsWith("Cloth"));
  }
  return mats;
}

function showInside(mats: SuitMaterials, inside: boolean) {
  for (const material of Object.values(mats)) {
    material.clippingPlanes = inside ? INSIDE_CLIP : [];
    material.clipShadows = true;
  }
  (mats.Cloth.userData.interior as { value: number }).value = inside
    ? 1
    : INTERIOR_LIGHT;
}

function shadeInterior(
  material: MeshPhysicalMaterial,
  interior: { value: number },
  lined = false,
) {
  const lining = { value: new Color("#111827") };
  material.userData.lining = lining;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.interiorLight = interior;
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      "uniform float interiorLight;\nvoid main() {",
    );
    if (lined) {
      shader.uniforms.liningColor = lining;
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform vec3 liningColor;\nvoid main() {")
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          if (!gl_FrontFacing) diffuseColor.rgb = liningColor;`,
        );
    }
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      if (!gl_FrontFacing) {
        reflectedLight.directDiffuse *= interiorLight;
        reflectedLight.indirectDiffuse *= interiorLight;
        reflectedLight.directSpecular *= interiorLight;
        reflectedLight.indirectSpecular *= interiorLight;
        #ifdef USE_SHEEN
          sheenSpecularDirect *= interiorLight;
          sheenSpecularIndirect *= interiorLight;
        #endif
      }`,
    );
  };
  material.customProgramCacheKey = () =>
    lined ? "suit-interior-lined" : "suit-interior";
}

const INTERIOR_LIGHT = 0.45;

const sheenTint = new Color("#c3ccda");

function applySelectionToMaterials(
  mats: SuitMaterials,
  selection: Suit3dSelection,
) {
  const setCloth = (
    material: MeshPhysicalMaterial,
    cloth: Suit3dMaterial,
    satin = false,
  ) => {
    material.color.set(cloth.color);
    material.roughness = satin ? 0.4 : cloth.roughness;
    material.sheen = satin ? 0.8 : (cloth.sheen ?? 0.35);
    material.sheenColor.set(cloth.color).lerp(sheenTint, 0.25);
    const weave = satin ? 0.15 : (cloth.weave ?? 0.35);
    material.normalScale.set(weave, weave);
  };
  const satin = selection.lapelMaterial.roughness < 0.6;
  for (const name of ["Cloth", "ClothDouble", "ClothDinner"]) {
    setCloth(mats[name], selection.fabricMaterial);
    (mats[name].userData.lining as { value: Color }).value.set(
      selection.liningMaterial.color,
    );
  }
  setCloth(mats.Lapel, selection.lapelMaterial, satin);
  setCloth(mats.LapelDouble, selection.lapelMaterial, satin);
  setCloth(mats.LapelDinner, selection.lapelMaterial, true);
  setCloth(mats.PocketPanel, selection.fabricMaterial);
  setCloth(mats.Trouser, selection.trouserMaterial);
  setCloth(mats.Waistcoat, selection.vestMaterial);
  mats.Button.color.set(selection.buttonMaterial.color);
  mats.Lining.color.set(selection.liningMaterial.color);
  mats.Buttonhole.color.set(
    selection.jacketDetails.buttonholeThread ?? selection.fabricMaterial.color,
  );
}

export class SuitSceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="studio-summary">
        <p className="mb-4 text-sm">
          The 3D preview could not load. Your design is still available.
        </p>
        <button
          className="mb-4 text-sm underline"
          onClick={() => {
            clearSuitAssets();
            this.setState({ failed: false });
          }}
        >
          Retry 3D preview
        </button>
        {this.props.fallback}
      </div>
    ) : (
      this.props.children
    );
  }
}
