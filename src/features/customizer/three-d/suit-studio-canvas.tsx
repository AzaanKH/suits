"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Box3, Mesh, PerspectiveCamera, Vector3, type Group } from "three";

import type { CustomizerConfiguration } from "../types";
import { getSuit3dCapability } from "./device-support";
import {
  SuitLighting,
  SuitSceneErrorBoundary,
  TailoredSuit,
  type SuitMood,
} from "./suit-model";
import {
  getSuitPartForMesh,
  type StudioStepCode,
  type SuitPart,
} from "./suit-parts";
import {
  getSuit3dSelection,
  getSuitBlock,
  isSuitMeshVisible,
} from "./suit-selection";
import { StudioFloor, SuitGallery, type GallerySuitView } from "./suit-gallery";
import { GALLERY_RADIUS, getGalleryPlacement } from "./suit-gallery-designs";

export type StudioCapture = () => Promise<string>;

/**
 * What the camera is doing. `fit` frames the active part of the visitor's suit;
 * the others belong to exploring the floor: `free` leaves the camera to the
 * visitor, `overview` lifts it above the room, `inspect` walks up to one suit.
 */
export type StudioView =
  | { kind: "fit" }
  | { kind: "free" }
  | { kind: "overview" }
  | { kind: "inspect"; index: number; count: number };

type Props = {
  configuration: CustomizerConfiguration;
  activeStep: StudioStepCode;
  onSelectStep: (step: SuitPart["step"]) => void;
  mood: SuitMood;
  turntable: boolean;
  onTurntableStop: () => void;
  /** Screen area covered by floating UI, so the suit centers in what remains. */
  insets: { right: number; bottom: number };
  captureRef: MutableRefObject<StudioCapture | null>;
  fallback: ReactNode;
  /** Suits on the floor. Empty until the visitor is first invited to look around. */
  gallery: GallerySuitView[];
  view: StudioView;
  inspectedId: string | null;
  onInspect: (id: string) => void;
  /** The visitor started orbiting or zooming. */
  onCameraStart: () => void;
};

export function SuitStudioCanvas({
  configuration,
  activeStep,
  onSelectStep,
  mood,
  turntable,
  onTurntableStop,
  insets,
  captureRef,
  fallback,
  gallery,
  view,
  inspectedId,
  onInspect,
  onCameraStart,
}: Props) {
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [capability] = useState(getSuit3dCapability);
  const [ready, setReady] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<SuitPart | null>(null);
  const [model, setModel] = useState<Group | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selection = useMemo(
    () => getSuit3dSelection(configuration),
    [configuration],
  );
  const onReady = useCallback(() => setReady(true), []);
  const clearHover = useCallback(() => setHoveredPart(null), []);
  const interaction = useMemo(
    () => ({
      hoveredStep: hoveredPart?.step ?? null,
      onHover: (
        part: SuitPart | null,
        event: { nativeEvent: PointerEvent },
      ) => {
        // Position updates go straight to the DOM; state changes only when the part does.
        const tooltip = tooltipRef.current;
        if (tooltip && part) {
          tooltip.style.transform = `translate(${event.nativeEvent.clientX + 14}px, ${event.nativeEvent.clientY + 14}px)`;
        }
        if (wrapperRef.current)
          wrapperRef.current.style.cursor = part ? "pointer" : "";
        setHoveredPart((current) =>
          current?.step === part?.step ? current : part,
        );
      },
      onSelect: (part: SuitPart) => {
        onTurntableStop();
        onSelectStep(part.step);
      },
    }),
    [hoveredPart, onSelectStep, onTurntableStop],
  );

  // The trouser options sit at the waistband, under the jacket.
  const trousersOnly = view.kind === "fit" && activeStep === "trousers";
  const block = getSuitBlock(selection);
  const pocketMesh = ["flap", "slanted", "welt", "patch"]
    .map((style) => `${block}_pocket_${style}`)
    .find((name) => isSuitMeshVisible(name, selection));

  if (!capability.supported) return <>{fallback}</>;

  return (
    <SuitSceneErrorBoundary fallback={fallback}>
      <div
        ref={wrapperRef}
        className="atelier-scene"
        role="region"
        aria-label="Full-screen 3D suit studio"
        data-ready={ready}
        data-active-step={activeStep}
        data-mood={mood}
        data-jacket={selection.selectedCodes.jacket}
        data-lapel={selection.selectedCodes.lapel}
        data-pocket-mesh={pocketMesh}
        data-trousers-only={trousersOnly}
      >
        <Canvas
          camera={{ fov: 30, position: [0.9, 1.1, 4.6], near: 0.05, far: 90 }}
          dpr={capability.simplified ? [1, 1.5] : [1, 2]}
          frameloop={turntable ? "always" : "demand"}
          shadows
          // Meshes carry BVH indexes (see SuitPiece); only the nearest hit matters.
          raycaster={{ firstHitOnly: true }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.setAttribute("data-testid", "suit-studio-canvas");
            gl.domElement.setAttribute(
              "aria-label",
              "Rotatable suit. Drag to orbit, scroll to zoom, and click a garment part to change it.",
            );
          }}
          onPointerMissed={() => setHoveredPart(null)}
        >
          <Suspense fallback={null}>
            <SuitLighting
              mood={mood}
              shadowResolution={capability.simplified ? 512 : 1024}
              postProcessed={!capability.simplified}
            />
            <TailoredSuit
              selection={selection}
              onReady={onReady}
              onModel={setModel}
              interaction={interaction}
              preloadBlocks
              // The trouser options sit at the waistband, under the jacket.
              trousersOnly={trousersOnly}
            />
            <Podium mood={mood} />
          </Suspense>
          <StudioFloor mood={mood} wide={view.kind !== "fit"} />
          {gallery.length > 0 ? (
            <SuitGallery
              designs={gallery}
              revealed={view.kind !== "fit"}
              inspectedId={inspectedId}
              mood={mood}
              reducedMotion={reducedMotion}
              onInspect={onInspect}
            />
          ) : null}
          {capability.simplified ? null : (
            // Ambient occlusion grounds folds, lapel rolls, and pocket edges
            // that direct light alone leaves flat. Skipped on low-power devices.
            <EffectComposer multisampling={4}>
              <N8AO
                aoRadius={0.12}
                distanceFalloff={0.5}
                intensity={2.2}
                quality="medium"
                halfRes
              />
              {/* The composer renders to a linear buffer, which skips the
                  renderer's own tone mapping; reapply R3F's ACES default. */}
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
          <StudioCamera
            model={ready ? model : null}
            activeStep={activeStep}
            insets={insets}
            turntable={turntable}
            view={view}
            reducedMotion={reducedMotion}
            onUserControl={() => {
              onTurntableStop();
              onCameraStart();
            }}
          />
          <CaptureBridge captureRef={captureRef} clearHover={clearHover} />
          <TestHook />
        </Canvas>
        {!ready ? (
          <div className="studio-scene-loading" role="status">
            Preparing your suit
          </div>
        ) : null}
        <div
          ref={tooltipRef}
          className="atelier-tooltip"
          aria-hidden="true"
          data-visible={Boolean(hoveredPart)}
        >
          {hoveredPart ? `Change ${hoveredPart.label.toLowerCase()}` : null}
        </div>
      </div>
    </SuitSceneErrorBoundary>
  );
}

function Podium({ mood }: { mood: SuitMood }) {
  const color =
    mood === "evening" ? "#2a313d" : mood === "atelier" ? "#dcded6" : "#e2e6e9";
  // Top sits just under the contact-shadow plane (y 0.024) so it is not captured as a caster.
  return (
    <mesh position={[0, -0.02, 0]} receiveShadow>
      <cylinderGeometry args={[0.62, 0.66, 0.08, 96]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

/**
 * For browser tests: when the page sets `window.__ARDEN_TEST__` before load,
 * `window.__ardenStudio.screenPoint(meshName)` returns where a visible part's
 * centre is on screen, so a test can point at it. Inert otherwise.
 */
function TestHook() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const w = window as Window & {
      __ARDEN_TEST__?: boolean;
      __ardenStudio?: unknown;
    };
    if (!w.__ARDEN_TEST__) return;
    w.__ardenStudio = {
      /** `side` picks the wearer's left (-1) or right (1) of a paired part. */
      screenPoint(name: string, side?: 1 | -1) {
        const { scene, camera, gl } = get();
        let target: Mesh | null = null;
        scene.traverseVisible((object) => {
          if (
            !target &&
            object instanceof Mesh &&
            object.name === name &&
            object.layers.isEnabled(0)
          )
            target = object;
        });
        if (!target) return null;
        const mesh = target as Mesh;
        const position = mesh.geometry.getAttribute("position");
        const centre = new Vector3();
        const vertex = new Vector3();
        let count = 0;
        for (let i = 0; i < position.count; i++) {
          vertex
            .fromBufferAttribute(position, i)
            .applyMatrix4(mesh.matrixWorld);
          if (side && vertex.x * side <= 0) continue;
          centre.add(vertex);
          count++;
        }
        if (!count) return null;
        const point = centre.divideScalar(count).project(camera);
        const rect = gl.domElement.getBoundingClientRect();
        return {
          x: rect.left + ((point.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - point.y) / 2) * rect.height,
        };
      },
    };
    return () => {
      delete w.__ardenStudio;
    };
  }, [get]);
  return null;
}

function StudioCamera({
  model,
  activeStep,
  insets,
  turntable,
  view,
  reducedMotion,
  onUserControl,
}: {
  model: Group | null;
  activeStep: StudioStepCode;
  insets: { right: number; bottom: number };
  turntable: boolean;
  view: StudioView;
  reducedMotion: boolean;
  onUserControl: () => void;
}) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const framed = useRef(false);
  const inspectIndex = view.kind === "inspect" ? view.index : -1;
  const inspectCount = view.kind === "inspect" ? view.count : 0;

  // Shift the projection so the suit centers in the area not covered by the panel.
  useLayoutEffect(() => {
    const { camera, invalidate } = get();
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.setViewOffset(
      size.width,
      size.height,
      insets.right / 2,
      insets.bottom / 2,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size.width, size.height, insets.right, insets.bottom]);

  const previousView = useRef(view.kind);

  // Fly to the garment part for the active step.
  useEffect(() => {
    const c = controls.current;
    if (!model || !c || view.kind !== "fit") return;
    // Back from the floor: face the suit again before framing it.
    const returning = previousView.current !== "fit";
    previousView.current = "fit";
    if (returning) void c.rotateTo(0.19, Math.PI * 0.47, !reducedMotion);
    const all = new Box3();
    const part = new Box3();
    // On the first frame the GLB's world matrices have not been computed yet.
    model.updateWorldMatrix(true, true);
    model.traverse((object) => {
      if (!(object instanceof Mesh) || !object.visible) return;
      all.expandByObject(object);
      if (getSuitPartForMesh(object.name)?.step === activeStep)
        part.expandByObject(object);
    });
    all.expandByPoint(new Vector3(0, -0.06, 0)); // keep the podium in the full view
    // The trouser options are all at the waistband: frame that, not the legs.
    if (activeStep === "trousers" && !part.isEmpty()) {
      part.min.y = Math.max(part.min.y, 0.55);
      part.max.y = Math.min(part.max.y, 1.02);
    }
    // Fabric, or a hidden part such as an unselected waistcoat, frames the whole suit.
    const target = activeStep === "fabric" || part.isEmpty() ? all : part;
    const extent = target.getSize(new Vector3()).length();
    const padding = Math.max(0.06, extent * 0.12);
    const animate = framed.current && !reducedMotion;
    framed.current = true;
    void c.fitToBox(target, animate, {
      paddingTop: padding,
      paddingBottom: padding,
      paddingLeft: padding,
      paddingRight: padding,
    });
    // With frameloop="demand" the controls only move the camera inside a frame; request one.
    get().invalidate();
  }, [model, activeStep, reducedMotion, get, view.kind]);

  // Exploring the floor: lift above the room, or walk up to one suit.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (view.kind === "fit") return;
    previousView.current = view.kind;
    // Azimuth accumulates across full turns; bring it back into ±π so the
    // floor's front-half limits clamp from the right side.
    c.normalizeRotations();
    const animate = !reducedMotion;
    const portrait = size.width < size.height;
    if (view.kind === "overview") {
      // Step back and up from the front: the visitor's suit in the foreground,
      // the lineup over its shoulders. Portrait screens need more distance.
      const back = portrait ? 1.6 : 1;
      // Raised enough that the lineup clears the visitor's suit's shoulders.
      void c.setLookAt(
        0.9 * back,
        3.6 * back,
        7.4 * back,
        0,
        0.55,
        -GALLERY_RADIUS * 0.5,
        animate,
      );
    } else if (view.kind === "inspect") {
      const { position } = getGalleryPlacement(inspectIndex, inspectCount);
      // Walk up at a three-quarter angle, which also keeps the visitor's own
      // suit (at the center) out of the line of sight.
      const distance = portrait ? 4.6 : 3.2;
      const [x, , z] = position;
      const length = Math.hypot(x, z);
      const [ux, uz] = [-x / length, -z / length]; // toward the center
      const turn = 0.45;
      const options = [turn, -turn].map((a) => [
        ux * Math.cos(a) + uz * Math.sin(a),
        -ux * Math.sin(a) + uz * Math.cos(a),
      ]);
      // Of the two angles, take the one nearer the front of the room.
      const [dx, dz] = options[0][1] >= options[1][1] ? options[0] : options[1];
      void c.setLookAt(
        x + dx * distance,
        1.2,
        z + dz * distance,
        x,
        0.85,
        z,
        animate,
      );
    } else return;
    get().invalidate();
  }, [
    view.kind,
    inspectIndex,
    inspectCount,
    reducedMotion,
    get,
    size.width,
    size.height,
  ]);

  useFrame((_, delta) => {
    if (turntable) void controls.current?.rotate(delta * 0.35, 0, false);
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={reducedMotion ? 0 : 0.4}
      truckSpeed={0}
      minDistance={0.45}
      maxDistance={view.kind === "fit" ? 7 : 14}
      // On the floor the lineup stands behind the visitor's suit; keep the
      // camera in the front half of the room so it never walks into it.
      minAzimuthAngle={view.kind === "fit" ? -Infinity : -Math.PI * 0.5}
      maxAzimuthAngle={view.kind === "fit" ? Infinity : Math.PI * 0.5}
      minPolarAngle={Math.PI * 0.12}
      maxPolarAngle={Math.PI * 0.6}
      onStart={onUserControl}
    />
  );
}

function CaptureBridge({
  captureRef,
  clearHover,
}: {
  captureRef: MutableRefObject<StudioCapture | null>;
  /** Removes the hover outline so it does not end up in the photo. */
  clearHover: () => void;
}) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    captureRef.current = async () => {
      clearHover();
      // Two frames: one for React to commit, one for the scene to redraw.
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const { gl, advance } = get();
      // Render a frame synchronously, through any post-processing, so the
      // buffer is current without preserveDrawingBuffer.
      advance(performance.now());
      return gl.domElement.toDataURL("image/png");
    };
    return () => {
      captureRef.current = null;
    };
  }, [get, captureRef, clearHover]);
  return null;
}
