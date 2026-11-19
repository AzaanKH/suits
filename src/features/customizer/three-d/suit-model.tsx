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
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Group,
  type Texture,
} from "three";

import type { Suit3dSelection } from "./suit-selection";
import { getSuitPartForMesh, type SuitPart } from "./suit-parts";

export const SUIT_MODEL_URL =
  "/models/suit-studio/arden-tailoring-optimized.glb?v=3";
const TEXTURES = "/models/suit-studio/textures/";
export const SUIT_TEXTURE_URLS = [
  "wool-albedo.webp",
  "single-normal.webp",
  "double-normal.webp",
  "dinner-normal.webp",
].map((file) => TEXTURES + file);

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
    background: "#ebe4d9",
    key: "#fff0d8",
    fill: "#f4e2c9",
    exposure: 1.2,
    shadow: "#5f4b36",
  },
  evening: {
    label: "Evening",
    background: "#1b212b",
    key: "#dfe7ff",
    fill: "#ffcf9a",
    exposure: 1.05,
    shadow: "#000000",
  },
};

type TailoredSuitProps = {
  selection: Suit3dSelection;
  onReady?: () => void;
  /** Receives the cloned scene once, for camera framing. */
  onModel?: (model: Group) => void;
  /** Enables part hover and click. Leave undefined for a passive preview. */
  interaction?: {
    hoveredStep: SuitPart["step"] | null;
    onHover: (part: SuitPart | null, event: ThreeEvent<PointerEvent>) => void;
    onSelect: (part: SuitPart) => void;
  };
};

export function TailoredSuit({
  selection,
  onReady,
  onModel,
  interaction,
}: TailoredSuitProps) {
  const { scene } = useGLTF(SUIT_MODEL_URL);
  const sourceTextures = useTexture(SUIT_TEXTURE_URLS);
  const invalidate = useThree((s) => s.invalidate);
  const model = useMemo(() => scene.clone(true), [scene]);
  const meshes = useMemo(() => {
    const list: Mesh[] = [];
    model.traverse((object) => {
      if (object instanceof Mesh) list.push(object);
    });
    return list;
  }, [model]);
  const textures = useMemo(() => {
    const wool = sourceTextures[0].clone();
    wool.wrapS = wool.wrapT = RepeatWrapping;
    wool.repeat.set(36, 36);
    wool.colorSpace = SRGBColorSpace;
    wool.anisotropy = 8;
    wool.needsUpdate = true;
    const [single, double, dinner] = sourceTextures.slice(1).map((source) => {
      const normal = source.clone();
      normal.flipY = false;
      normal.needsUpdate = true;
      return normal;
    });
    return { wool, single, double, dinner };
  }, [sourceTextures]);
  // Built once per texture set; selection changes only update uniforms below.
  const materials = useMemo(() => createMaterials(textures), [textures]);

  useLayoutEffect(() => {
    onModel?.(model);
  }, [model, onModel]);

  useLayoutEffect(() => {
    applySelectionToMaterials(materials, selection);
    const codes = selection.selectedCodes;
    const double = codes.jacket === "double-breasted-six-button";
    const dinner = codes.lapel === "shawl-lapel";
    const block = dinner ? "dinner" : double ? "double" : "single";
    const lapel = codes.lapel.replace("-lapel", "");
    const pocket =
      codes.pockets === "patch-pockets"
        ? "patch"
        : codes.pockets === "jetted-pockets"
          ? "welt"
          : codes.pockets === "slanted-flap-pockets"
            ? "slanted"
            : "flap";
    const vest = Boolean(codes.vest);
    const waist = selection.trouserDetails?.waist ?? codes.trousers;
    const pleats =
      selection.trouserDetails?.pleats ??
      (codes.trousers === "single-pleat-trousers" ? "single" : "flat");
    // Mutate through traverse: three.js objects are imperative, not React state.
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const name = object.name;
      object.visible = true;
      if (
        name.startsWith("single_") ||
        name.startsWith("double_") ||
        name.startsWith("dinner_")
      )
        object.visible = name.startsWith(block + "_");
      if (name.includes("_lapel_"))
        object.visible &&= name.endsWith("_" + lapel);
      if (name.includes("_pocket_"))
        object.visible &&= name.endsWith("_" + pocket);
      if (
        name === "single_button_11" &&
        codes.jacket === "single-breasted-one-button"
      )
        object.visible = false;
      if (name.startsWith("shirt_button_") && (double || dinner))
        object.visible = false;
      if (name.startsWith("vest_") || name === "waistcoat")
        object.visible = vest;
      if (name.startsWith("waist_loop_"))
        object.visible = waist === "belt-loops";
      if (name.startsWith("waist_adjuster_"))
        object.visible = waist === "side-adjusters";
      if (name.startsWith("pleat_"))
        object.visible =
          pleats !== "flat" && (pleats === "double" || name.endsWith("_0"));
      // three.js raycasts invisible meshes; a separate layer keeps hidden blocks unclickable.
      object.layers.set(object.visible ? 0 : HIDDEN_LAYER);
      // The clone keeps source material names until first assignment. Store them once.
      object.userData.slot ??= (
        Array.isArray(object.material) ? object.material[0] : object.material
      ).name;
      const slot = object.userData.slot as string;
      const variant = name.startsWith("dinner_")
        ? "Dinner"
        : name.startsWith("double_")
          ? "Double"
          : "";
      object.material =
        materials[`${slot}${variant}`] ?? materials[slot] ?? materials.Cloth;
      object.castShadow = object.receiveShadow = true;
    });
    invalidate();
    onReady?.();
  }, [selection, model, materials, invalidate, onReady]);

  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  useEffect(
    () => () => Object.values(textures).forEach((t) => t.dispose()),
    [textures],
  );

  const hoveredStep = interaction?.hoveredStep ?? null;
  const outlined = hoveredStep
    ? meshes.filter((m) => getSuitPartForMesh(m.name)?.step === hoveredStep)
    : [];

  return (
    <>
      <primitive
        object={model}
        dispose={null}
        onPointerMove={
          interaction
            ? (event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                interaction.onHover(
                  getSuitPartForMesh(event.object.name),
                  event,
                );
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
      />
      {outlined.map((mesh) =>
        createPortal(
          <Outlines
            key={mesh.uuid}
            // drei 10.7.9 swaps the shader branches: screenspace={false} is the
            // pixel-width path. Re-check if drei fixes it. angle={0} keeps the
            // mesh normals instead of re-creasing the quantized geometry.
            thickness={3}
            screenspace={false}
            angle={0}
            color="#b08a4f"
          />,
          mesh,
        ),
      )}
    </>
  );
}

export function SuitLighting({
  mood = "daylight",
  shadowResolution = 512,
}: {
  mood?: SuitMood;
  shadowResolution?: number;
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
      <color attach="background" args={[preset.background]} />
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
    </>
  );
}

function createMaterials(maps: {
  wool: Texture;
  single: Texture;
  double: Texture;
  dinner: Texture;
}): Record<string, MeshPhysicalMaterial> {
  const cloth = (normal: Texture) =>
    new MeshPhysicalMaterial({
      map: maps.wool,
      roughness: 0.88,
      normalMap: normal,
      normalScale: new Vector2(0.35, 0.35),
      metalness: 0,
      sheen: 0.35,
      sheenRoughness: 0.85,
      envMapIntensity: 0.65,
      side: DoubleSide,
    });
  const mats: Record<string, MeshPhysicalMaterial> = {
    Cloth: cloth(maps.single),
    ClothDouble: cloth(maps.double),
    ClothDinner: cloth(maps.dinner),
    Lapel: cloth(maps.single),
    LapelDouble: cloth(maps.double),
    LapelDinner: cloth(maps.dinner),
    Trouser: cloth(maps.single),
    Waistcoat: cloth(maps.single),
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
  for (const [name, material] of Object.entries(mats)) material.name = name;
  return mats;
}

const sheenTint = new Color("#c3ccda");

function applySelectionToMaterials(
  mats: Record<string, MeshPhysicalMaterial>,
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
            useGLTF.clear(SUIT_MODEL_URL);
            useTexture.clear(SUIT_TEXTURE_URLS);
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
