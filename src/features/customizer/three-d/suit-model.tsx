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
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Group,
  type Object3D,
  type Texture,
} from "three";

import {
  getSuitBlock,
  isSuitMeshVisible,
  type Suit3dSelection,
  type SuitBlock,
} from "./suit-selection";
import { getSuitPartForMesh, type SuitPart } from "./suit-parts";

BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// Bump after regenerating the GLBs or textures so browsers skip cached copies.
const ASSET_VERSION = "?v=4";
const MODELS = "/models/suit-studio/";
const TEXTURES = MODELS + "textures/";

/** Shared meshes plus the default single-breasted block. Always loaded. */
export const SUIT_CORE_URL = `${MODELS}suit-core.glb${ASSET_VERSION}`;
const CORE_TEXTURE_URLS = [
  `${TEXTURES}wool-albedo.webp${ASSET_VERSION}`,
  `${TEXTURES}single-normal.webp${ASSET_VERSION}`,
];
/** The other jacket blocks load the first time a selection needs them. */
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

/** Fetches the other jacket blocks in the background so switching is instant. */
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

/** Hidden garment blocks move to this layer so pointer raycasts skip them. */
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
    // Pattern paper, matching the site's --background.
    background: "#f3f3ef",
    key: "#fff6ea",
    fill: "#eceee8",
    exposure: 1.2,
    shadow: "#3d4350",
  },
  evening: {
    label: "Evening",
    // The dark theme's --background, so the studio matches the site at night.
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
  /** Receives the suit group once, for camera framing. */
  onModel?: (model: Group) => void;
  /** Enables part hover and click. Leave undefined for a passive preview. */
  interaction?: {
    hoveredStep: SuitPart["step"] | null;
    onHover: (part: SuitPart | null, event: ThreeEvent<PointerEvent>) => void;
    onSelect: (part: SuitPart) => void;
  };
  /** Fetch the other jacket blocks once the suit is on screen. */
  preloadBlocks?: boolean;
};

type SuitMaterials = Record<string, MeshPhysicalMaterial>;

export function TailoredSuit({
  selection,
  onReady,
  onModel,
  interaction,
  preloadBlocks = false,
}: TailoredSuitProps) {
  // A block swap may need a download. Rendering a deferred copy of the selection
  // keeps the current suit on screen until the new block has loaded; a suspended
  // background render never replaces committed UI with the Suspense fallback.
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
  // Built once per texture set; selection changes only update uniforms below.
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
    // Mutate through traverse: three.js objects are imperative, not React state.
    group.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.visible = isSuitMeshVisible(object.name, shown);
      // three.js raycasts invisible meshes; a separate layer keeps hidden blocks unclickable.
      object.layers.set(object.visible ? 0 : HIDDEN_LAYER);
      // The clone keeps source material names until first assignment. Store them once.
      object.userData.slot ??= (
        Array.isArray(object.material) ? object.material[0] : object.material
      ).name;
      const slot = object.userData.slot as string;
      const variant = object.name.startsWith("dinner_")
        ? "Dinner"
        : object.name.startsWith("double_")
          ? "Double"
          : "";
      object.material =
        materials[`${slot}${variant}`] ?? materials[slot] ?? materials.Cloth;
      object.castShadow = object.receiveShadow = true;
    });
    invalidate();
    onReady?.();
  }, [shown, block, materials, invalidate, onReady]);

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
              interaction.onHover(getSuitPartForMesh(event.object.name), event);
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
              // Ignore the click that ends an orbit drag.
              if (event.delta > 6) return;
              const part = getSuitPartForMesh(event.object.name);
              if (part) interaction.onSelect(part);
            }
          : undefined
      }
    >
      <SuitPiece
        object={core}
        hoveredStep={hoveredStep}
        interactive={Boolean(interaction)}
      />
      {block === "single" ? null : (
        <SuitBlockModel
          block={block}
          materials={materials}
          hoveredStep={hoveredStep}
          interactive={Boolean(interaction)}
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
}: {
  block: Exclude<SuitBlock, "single">;
  materials: SuitMaterials;
  hoveredStep: SuitPart["step"] | null;
  interactive: boolean;
}) {
  const assets = BLOCK_ASSETS[block];
  const { scene } = useGLTF(assets.model);
  const normalSource = useTexture(assets.normal);
  const model = useMemo(() => scene.clone(true), [scene]);
  const normal = useMemo(() => toGltfNormal(normalSource), [normalSource]);
  // Runs before the parent's layout effect assigns materials in the same commit.
  useLayoutEffect(() => {
    setBlockNormal(materials, block, normal);
  }, [materials, block, normal]);
  useEffect(() => () => normal.dispose(), [normal]);
  return (
    <SuitPiece
      object={model}
      hoveredStep={hoveredStep}
      interactive={interactive}
    />
  );
}

function SuitPiece({
  object,
  hoveredStep,
  interactive,
}: {
  object: Object3D;
  hoveredStep: SuitPart["step"] | null;
  /** Builds raycast acceleration structures for hover and click. */
  interactive: boolean;
}) {
  const meshes = useMemo(() => {
    const list: Mesh[] = [];
    object.traverse((child) => {
      if (child instanceof Mesh) list.push(child);
    });
    return list;
  }, [object]);
  // Per piece rather than drei's <Bvh>, which only indexes meshes present at
  // its first mount and would miss blocks that load later. Clones share
  // geometry, so each geometry is indexed once.
  useEffect(() => {
    if (!interactive) return;
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      if (!child.geometry.boundsTree) child.geometry.computeBoundsTree();
      child.raycast = acceleratedRaycast;
    });
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
              // drei 10.7.9 swaps the shader branches: screenspace={false} is the
              // pixel-width path. Re-check if drei fixes it. angle={0} keeps the
              // mesh normals instead of re-creasing the quantized geometry.
              thickness={3}
              screenspace={false}
              angle={0}
              // Tailor's chalk: the part a click will change.
              color="#4a6fd0"
            />,
            mesh,
          )}
        </Fragment>
      ))}
    </>
  );
}

/** glTF UVs expect textures without the default vertical flip. */
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
  /**
   * Set when the studio's post-processing composer (ambient occlusion plus
   * tone mapping) renders the frame. The background is pre-compensated so it
   * still lands on the mood color, and contact shadows are left to the AO.
   */
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
      {/* frames={1} bakes the environment once; the key remounts it per mood. */}
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
      {/* ContactShadows' own depth pass breaks under the post-processing
          composer (it reads back as light blotches). The composer's ambient
          occlusion grounds the suit there instead. */}
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

/**
 * The linear color that three's ACESFilmicToneMapping maps to `hex`, so a
 * tone-mapped background keeps its exact design color. Inverts the curve in
 * three/src/renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js.
 */
function untoneMapped(hex: string, exposure: number): Color {
  const target = new Color(hex); // sRGB hex -> linear working space
  const y = multiply(ACES_OUTPUT_INVERSE, [target.r, target.g, target.b]);
  const z = y.map((v) => {
    // Solve RRTAndODTFit(x) = v for x >= 0.
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

// Row-major forms of the column-major GLSL matrices in three's ACES chunk.
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
  // Double and Dinner slots start on the single normal map; SuitBlockModel
  // swaps in the block's own map when it loads.
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
  };
  for (const [name, material] of Object.entries(mats)) {
    material.name = name;
    if (material.side === DoubleSide) shadeInterior(material);
  }
  return mats;
}

/**
 * The suit is a hollow shell with no body inside. Without this, the inside of
 * the collar, cuffs, and hems is lit like the outside and reads as a bright
 * white hole. Back faces get a fraction of the light, like a garment's
 * shadowed interior.
 */
function shadeInterior(material: MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      if (!gl_FrontFacing) {
        reflectedLight.directDiffuse *= ${INTERIOR_LIGHT};
        reflectedLight.indirectDiffuse *= ${INTERIOR_LIGHT};
        reflectedLight.directSpecular *= ${INTERIOR_LIGHT};
        reflectedLight.indirectSpecular *= ${INTERIOR_LIGHT};
        #ifdef USE_SHEEN
          sheenSpecularDirect *= ${INTERIOR_LIGHT};
          sheenSpecularIndirect *= ${INTERIOR_LIGHT};
        #endif
      }`,
    );
  };
  material.customProgramCacheKey = () => "suit-interior";
}

const INTERIOR_LIGHT = "0.45";

const sheenTint = new Color("#c3ccda");

function applySelectionToMaterials(
  mats: SuitMaterials,
  selection: Suit3dSelection,
) {
  const setCloth = (
    material: MeshPhysicalMaterial,
    color: string,
    satin = false,
  ) => {
    material.color.set(color);
    material.roughness = satin ? 0.4 : 0.88;
    material.sheen = satin ? 0.8 : 0.35;
    material.sheenColor.set(color).lerp(sheenTint, 0.25);
  };
  const satin = selection.lapelMaterial.roughness < 0.6;
  for (const name of ["Cloth", "ClothDouble", "ClothDinner"])
    setCloth(mats[name], selection.fabricMaterial.color);
  setCloth(mats.Lapel, selection.lapelMaterial.color, satin);
  setCloth(mats.LapelDouble, selection.lapelMaterial.color, satin);
  setCloth(mats.LapelDinner, selection.lapelMaterial.color, true);
  setCloth(mats.Trouser, selection.trouserMaterial.color);
  setCloth(mats.Waistcoat, selection.vestMaterial.color);
  mats.Button.color.set(selection.buttonMaterial.color);
  mats.Lining.color.set(selection.liningMaterial.color);
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
