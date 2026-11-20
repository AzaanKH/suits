"use client";

import Link from "next/link";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentRef,
} from "react";
import { OrthographicCamera } from "three";

import type { CustomizerCatalog, CustomizerConfiguration } from "../types";
import { tailoringRows } from "../tailoring";
import { getSuit3dSelection } from "./suit-selection";
import { getSuit3dCapability } from "./device-support";
import {
  SuitLighting,
  SuitSceneErrorBoundary,
  TailoredSuit,
} from "./suit-model";

type View = "Front" | "Side" | "Back" | "Detail";
const VIEWS: View[] = ["Front", "Side", "Back", "Detail"];
type Props = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  fallback: ReactNode;
};

export function Suit3dPreview({ configuration, fallback }: Props) {
  const [capability] = useState(getSuit3dCapability);
  const { resolvedTheme } = useTheme();
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
    <SuitSceneErrorBoundary fallback={fallback}>
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
              gl.setClearAlpha(0);
            }}
          >
            <Suspense fallback={null}>
              <SuitLighting
                mood={resolvedTheme === "dark" ? "evening" : "atelier"}
              />
              <TailoredSuit
                selection={selection}
                onReady={onReady}
                preloadBlocks
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
        <Link
          className="studio-open-link"
          href={`/studio/${configuration.productSlug}`}
        >
          <Maximize2 aria-hidden="true" className="size-3.5" />
          Open studio
        </Link>
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
    </SuitSceneErrorBoundary>
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
