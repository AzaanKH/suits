"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentRef,
} from "react";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Material,
  type Texture,
  OrthographicCamera,
} from "three";

import type { CustomizerCatalog, CustomizerConfiguration } from "../types";
import { tailoringRows } from "../tailoring";
import { getSuit3dSelection, type Suit3dSelection } from "./suit-selection";
import { getSuit3dCapability } from "./device-support";

const MODEL = "/models/suit-studio/arden-tailoring-optimized.glb?v=3";
const TEXTURES = "/models/suit-studio/textures/";
const TEXTURE_URLS = [
  "wool-albedo.webp",
  "single-normal.webp",
  "double-normal.webp",
  "dinner-normal.webp",
].map((file) => TEXTURES + file);
type View = "Front" | "Side" | "Back" | "Detail";
const VIEWS: View[] = ["Front", "Side", "Back", "Detail"];
type Props = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  fallback: ReactNode;
};

export function Suit3dPreview({ configuration, fallback }: Props) {
  const [capability] = useState(getSuit3dCapability);
  const [view, setView] = useState<View>("Front");
  const [ready, setReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const selection = useMemo(
    () => getSuit3dSelection(configuration),
    [configuration],
  );
  const onReady = useCallback(() => setReady(true), []);
  if (!capability.supported)
    return (
      <div className="studio-summary">
        <p className="mb-4 text-sm">
          3D is unavailable in this browser. Your selections are saved below.
        </p>
        {fallback}
      </div>
    );
  return (
    <SceneErrorBoundary fallback={fallback}>
      <div
        className="studio-scene"
        role="region"
        aria-label="Interactive 3D suit preview"
        data-model-version="studio-1"
        data-fabric={selection.selectedCodes.fabric}
        data-jacket={selection.selectedCodes.jacket}
        data-lapel={selection.selectedCodes.lapel}
        data-pocket={selection.selectedCodes.pockets}
        data-view={view}
        data-ready={ready}
      >
        {tailoringRows(configuration.tailoring).some(
          (r) => r.preview === "specification",
        ) ? (
          <p className="studio-render-note">
            Construction and measurement requests are recorded in your
            specification.
          </p>
        ) : null}
        <div className="studio-canvas">
          <Canvas
            orthographic
            camera={{
              position: [0.22, 0.82, 3.6],
              zoom: 400,
              near: 0.05,
              far: 20,
            }}
            dpr={capability.simplified ? [1, 1.5] : [1, 2]}
            frameloop="demand"
            shadows
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.domElement.setAttribute("data-testid", "suit-3d-canvas");
              gl.domElement.setAttribute(
                "aria-label",
                "Rotatable suit. Use the camera buttons for front, side, back and detail views.",
              );
              gl.toneMappingExposure = 1.25;
              gl.setClearAlpha(0);
            }}
          >
            <color attach="background" args={["#eef0f1"]} />
            <ambientLight intensity={0.7} />
            <hemisphereLight args={["#ffffff", "#b9c2ce", 0.7]} />
            <directionalLight
              castShadow
              position={[-3, 4, 5]}
              intensity={2.8}
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
              intensity={1.9}
              color="#e5edff"
            />
            <Suspense fallback={null}>
              <Environment resolution={256} frames={1}>
                <Lightformer
                  form="rect"
                  intensity={3.5}
                  position={[-3, 3, 3]}
                  scale={[3, 5, 1]}
                  rotation={[0, Math.PI / 4, 0]}
                />
                <Lightformer
                  form="rect"
                  intensity={2}
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
              <TailoredSuit
                selection={selection}
                configuration={configuration}
                onReady={onReady}
              />
              <ContactShadows
                position={[0, 0.024, 0]}
                opacity={0.4}
                scale={2.8}
                blur={2.5}
                far={0.65}
                resolution={512}
                frames={3}
                color="#526070"
              />
            </Suspense>
            <CameraRig view={view} revision={cameraRevision} />
          </Canvas>
        </div>
        {!ready ? (
          <div className="studio-scene-loading" role="status">
            Preparing your suit
          </div>
        ) : null}
        <div className="studio-camera-controls" aria-label="Camera views">
          {VIEWS.map((v) => (
            <button
              type="button"
              key={v}
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setCameraRevision((value) => value + 1);
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="studio-orbit-hint">
          Drag to rotate. Scroll to explore the detail.
        </p>
      </div>
    </SceneErrorBoundary>
  );
}

function CameraRig({ view, revision }: { view: View; revision: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);
  useLayoutEffect(() => {
    const { camera, invalidate } = get();
    const target = view === "Detail" ? [0, 1.24, 0] : [0, 0.79, 0];
    // Maintain full-garment framing in both tall desktop and wide mobile stages.
    const distance = 3.6;
    if (camera instanceof OrthographicCamera) {
      camera.zoom = Math.min(
        size.height / (view === "Detail" ? 0.65 : 1.74),
        size.width / (view === "Detail" ? 0.72 : 1.1),
      );
      camera.updateProjectionMatrix();
    }
    const position =
      view === "Side"
        ? [distance, 0.84, 0.25]
        : view === "Back"
          ? [-0.18, 0.85, -distance]
          : view === "Detail"
            ? [0.1, 1.27, 1.35]
            : [0.65, 0.86, distance];
    camera.position.set(...(position as [number, number, number]));
    controls.current?.target.set(...(target as [number, number, number]));
    camera.lookAt(...(target as [number, number, number]));
    controls.current?.update();
    invalidate();
  }, [view, revision, get, size.width, size.height]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.65}
      minZoom={100}
      maxZoom={1600}
      minPolarAngle={Math.PI * 0.3}
      maxPolarAngle={Math.PI * 0.6}
      target={[0, 0.79, 0]}
    />
  );
}

function TailoredSuit({
  selection,
  configuration,
  onReady,
}: {
  selection: Suit3dSelection;
  configuration: CustomizerConfiguration;
  onReady: () => void;
}) {
  const { scene } = useGLTF(MODEL);
  const sourceTextures = useTexture(TEXTURE_URLS);
  const invalidate = useThree((s) => s.invalidate);
  const model = useMemo(() => scene.clone(true), [scene]);
  const textures = useMemo(() => {
    const wool = sourceTextures[0].clone();
    wool.wrapS = wool.wrapT = RepeatWrapping;
    wool.repeat.set(36, 36);
    wool.colorSpace = SRGBColorSpace;
    wool.anisotropy = 8;
    wool.needsUpdate = true;
    const single = sourceTextures[1].clone();
    single.flipY = false;
    single.needsUpdate = true;
    const double = sourceTextures[2].clone();
    double.flipY = false;
    double.needsUpdate = true;
    const dinner = sourceTextures[3].clone();
    dinner.flipY = false;
    dinner.needsUpdate = true;
    return { wool, single, double, dinner };
  }, [sourceTextures]);
  const materials = useMemo(
    () => createMaterials(selection, textures),
    [selection, textures],
  );
  useLayoutEffect(() => {
    const double =
      selection.selectedCodes.jacket === "double-breasted-six-button";
    const dinner = selection.selectedCodes.lapel === "shawl-lapel";
    const block = dinner ? "dinner" : double ? "double" : "single";
    const lapel = selection.selectedCodes.lapel.replace("-lapel", "");
    const pocket =
      selection.selectedCodes.pockets === "patch-pockets"
        ? "patch"
        : selection.selectedCodes.pockets === "jetted-pockets"
          ? "welt"
          : selection.selectedCodes.pockets === "slanted-flap-pockets"
            ? "slanted"
            : "flap";
    const vest = Boolean(selection.selectedCodes.vest);
    const waist =
      selection.trouserDetails?.waist ?? selection.selectedCodes.trousers;
    const pleats =
      selection.trouserDetails?.pleats ??
      (selection.selectedCodes.trousers === "single-pleat-trousers"
        ? "single"
        : "flat");
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
        selection.selectedCodes.jacket === "single-breasted-one-button"
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
      const materialName = (
        Array.isArray(object.material) ? object.material[0] : object.material
      ).name;
      // The cloned scene retains source slot names until first assignment. Store them once.
      object.userData.slot ??= materialName;
      const slot = object.userData.slot as string;
      object.material =
        materials[
          `${slot}${name.startsWith("dinner_") ? "Dinner" : name.startsWith("double_") ? "Double" : ""}`
        ] ??
        materials[slot] ??
        materials.Cloth;
      object.castShadow = object.receiveShadow = true;
    });
    invalidate();
    onReady();
  }, [selection, configuration, model, materials, invalidate, onReady]);
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  useEffect(
    () => () => Object.values(textures).forEach((t) => t.dispose()),
    [textures],
  );
  return <primitive object={model} dispose={null} />;
}

function createMaterials(
  selection: Suit3dSelection,
  maps: { wool: Texture; single: Texture; double: Texture; dinner: Texture },
): Record<string, Material> {
  const cloth = (color: string, normal: Texture = maps.single, satin = false) =>
    new MeshPhysicalMaterial({
      color: new Color(color),
      map: maps.wool,
      roughness: satin ? 0.4 : 0.88,
      normalMap: normal,
      normalScale: new Vector2(0.35, 0.35),
      metalness: 0,
      sheen: satin ? 0.8 : 0.35,
      sheenRoughness: 0.85,
      sheenColor: new Color(color).lerp(new Color("#c3ccda"), 0.25),
      envMapIntensity: 0.65,
      side: DoubleSide,
    });
  const satin = selection.lapelMaterial.roughness < 0.6;
  const mats: Record<string, Material> = {
    Cloth: cloth(selection.fabricMaterial.color),
    ClothDouble: cloth(selection.fabricMaterial.color, maps.double),
    ClothDinner: cloth(selection.fabricMaterial.color, maps.dinner),
    Lapel: cloth(selection.lapelMaterial.color, maps.single, satin),
    LapelDouble: cloth(selection.lapelMaterial.color, maps.double, satin),
    LapelDinner: cloth(selection.lapelMaterial.color, maps.dinner, true),
    Trouser: cloth(selection.trouserMaterial.color),
    Waistcoat: cloth(selection.vestMaterial.color),
    Shirt: new MeshPhysicalMaterial({
      color: "#eef0ed",
      roughness: 0.85,
      side: DoubleSide,
      sheen: 0.15,
    }),
    Button: new MeshPhysicalMaterial({
      color: selection.buttonMaterial.color,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    }),
    Lining: new MeshPhysicalMaterial({
      color: selection.liningMaterial.color,
      roughness: 0.45,
      sheen: 0.8,
      side: DoubleSide,
    }),
  };
  for (const [name, material] of Object.entries(mats)) material.name = name;
  return mats;
}

class SceneErrorBoundary extends Component<
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
            useGLTF.clear(MODEL);
            useTexture.clear(TEXTURE_URLS);
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
