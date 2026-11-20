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
import { getSuit3dSelection } from "./suit-selection";

export type StudioCapture = () => Promise<string>;

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
}: Props) {
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
      >
        <Canvas
          camera={{ fov: 30, position: [0.9, 1.1, 4.6], near: 0.05, far: 40 }}
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
            />
            <Podium mood={mood} />
          </Suspense>
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
            onUserControl={onTurntableStop}
          />
          <CaptureBridge captureRef={captureRef} clearHover={clearHover} />
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

function StudioCamera({
  model,
  activeStep,
  insets,
  turntable,
  onUserControl,
}: {
  model: Group | null;
  activeStep: StudioStepCode;
  insets: { right: number; bottom: number };
  turntable: boolean;
  onUserControl: () => void;
}) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const framed = useRef(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

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

  // Fly to the garment part for the active step.
  useEffect(() => {
    const c = controls.current;
    if (!model || !c) return;
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
  }, [model, activeStep, reducedMotion, get]);

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
      maxDistance={7}
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
