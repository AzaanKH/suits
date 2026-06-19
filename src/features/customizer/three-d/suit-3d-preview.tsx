"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { AlertTriangle, Box, Gauge, Rotate3D } from "lucide-react";
import {
  Component,
  Suspense,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from "three";

import { Badge } from "@/components/ui/badge";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
} from "@/features/customizer/types";
import { useCustomizerStore } from "@/store/customizer-store";

import {
  getSuit3dAssetSelection,
  getSuit3dAssetUrls,
  type Suit3dAssetSelection,
  type Suit3dMaterial,
  type Suit3dModelAsset,
} from "./asset-contract";
import { getSuit3dCapability, type Suit3dCapability } from "./device-support";

type Suit3dPreviewProps = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  fallback: ReactNode;
};

type RuntimeMetrics = {
  selectionKey: string;
  initialLoadMs: number | null;
  firstInteractionMs: number | null;
};

const emptyMetrics: RuntimeMetrics = {
  selectionKey: "",
  initialLoadMs: null,
  firstInteractionMs: null,
};

export function Suit3dPreview({
  catalog,
  configuration,
  fallback,
}: Suit3dPreviewProps) {
  const activeProductSlug = useCustomizerStore(
    (state) => state.activeProductSlug,
  );
  const storeConfiguration = useCustomizerStore((state) => state.configuration);
  const currentConfiguration =
    activeProductSlug === catalog.product.slug && storeConfiguration
      ? storeConfiguration
      : configuration;
  const selection = useMemo(
    () => getSuit3dAssetSelection(currentConfiguration),
    [currentConfiguration],
  );
  const selectionKey = `${selection.selectedCodes.fabric}:${selection.selectedCodes.jacket}:${selection.selectedCodes.lapel}:${selection.selectedCodes.buttons}`;
  const [capability] = useState<Suit3dCapability>(() => getSuit3dCapability());
  const [metrics, setMetrics] = useState<RuntimeMetrics>(emptyMetrics);
  const visibleMetrics =
    metrics.selectionKey === selectionKey ? metrics : emptyMetrics;
  const loadStartRef = useRef<number | null>(null);
  const controlStartRef = useRef<number | null>(null);
  const hasMeasuredInteractionRef = useRef(false);

  useLayoutEffect(() => {
    loadStartRef.current = performance.now();
    hasMeasuredInteractionRef.current = false;
    controlStartRef.current = null;
  }, [selectionKey]);

  const handleSceneReady = useCallback(() => {
    const startedAt = loadStartRef.current ?? performance.now();
    const initialLoadMs = Math.round(performance.now() - startedAt);

    performance.mark("suit-3d-ready");
    performance.measure("suit-3d-initial-load", {
      start: startedAt,
      end: performance.now(),
    });
    setMetrics((current) => ({
      ...current,
      selectionKey,
      initialLoadMs,
    }));
    loadStartRef.current = null;
  }, [selectionKey]);

  const handleControlStart = useCallback(() => {
    if (hasMeasuredInteractionRef.current) {
      return;
    }

    controlStartRef.current = performance.now();
  }, []);

  const handleControlChange = useCallback(() => {
    if (hasMeasuredInteractionRef.current || controlStartRef.current === null) {
      return;
    }

    const firstInteractionMs = Math.round(
      performance.now() - controlStartRef.current,
    );

    performance.mark("suit-3d-first-orbit-change");
    performance.measure("suit-3d-first-orbit-response", {
      start: controlStartRef.current,
      end: performance.now(),
    });
    hasMeasuredInteractionRef.current = true;
    setMetrics((current) => ({
      ...current,
      selectionKey,
      firstInteractionMs,
    }));
  }, [selectionKey]);

  if (!selection.supportedProduct) {
    return (
      <Suit3dFallback
        fallback={fallback}
        title="3D proof of concept"
        description="The interactive 3D preview is currently available for The House Suit while the asset pipeline is validated."
      />
    );
  }

  if (!capability.supported) {
    return (
      <Suit3dFallback
        fallback={fallback}
        title="3D preview unavailable"
        description={capability.reason ?? "The 2D preview remains available."}
      />
    );
  }

  return (
    <Suit3dErrorBoundary
      fallback={
        <Suit3dFallback
          fallback={fallback}
          title="3D preview could not load"
          description="The 2D preview remains available while the 3D asset is repaired."
        />
      }
    >
      <div
        data-testid="suit-3d-preview-shell"
        className="bg-card overflow-hidden rounded-lg border"
      >
        <div
          className="relative aspect-[4/5]"
          role="region"
          aria-label="Interactive 3D suit preview"
        >
          <SuitSceneCanvas
            selection={selection}
            capability={capability}
            onReady={handleSceneReady}
            onControlStart={handleControlStart}
            onControlChange={handleControlChange}
          />
          {visibleMetrics.initialLoadMs === null ? (
            <div className="bg-card/85 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Box aria-hidden="true" className="size-4" />
                Preparing 3D preview
              </div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{selection.fabricMaterial.label}</Badge>
            <Badge variant="outline">{selection.assets.jacket.label}</Badge>
          </div>
        </div>
        <div className="border-t p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground flex items-center gap-2">
              <Rotate3D aria-hidden="true" className="size-3.5" />
              Orbit preview
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              {capability.simplified ? <span>{capability.reason}</span> : null}
              {visibleMetrics.initialLoadMs !== null ? (
                <span className="inline-flex items-center gap-1">
                  <Gauge aria-hidden="true" className="size-3.5" />
                  Load {visibleMetrics.initialLoadMs}ms
                </span>
              ) : null}
              {visibleMetrics.firstInteractionMs !== null ? (
                <span>Orbit {visibleMetrics.firstInteractionMs}ms</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Suit3dErrorBoundary>
  );
}

function SuitSceneCanvas({
  selection,
  capability,
  onReady,
  onControlStart,
  onControlChange,
}: {
  selection: Suit3dAssetSelection;
  capability: Suit3dCapability;
  onReady: () => void;
  onControlStart: () => void;
  onControlChange: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.25, 5], fov: 34, near: 0.1, far: 20 }}
      dpr={capability.simplified ? 1 : [1, 1.5]}
      frameloop="demand"
      gl={{
        antialias: !capability.simplified,
        powerPreference: capability.simplified
          ? "low-power"
          : "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.domElement.dataset.testid = "suit-3d-canvas";
      }}
    >
      <color attach="background" args={["#eee9df"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 4]} intensity={1.45} />
      <directionalLight position={[-3, 2.5, 2]} intensity={0.5} />
      <Suspense fallback={null}>
        <SuitScene
          selection={selection}
          onReady={onReady}
          onControlStart={onControlStart}
          onControlChange={onControlChange}
        />
      </Suspense>
    </Canvas>
  );
}

function SuitScene({
  selection,
  onReady,
  onControlStart,
  onControlChange,
}: {
  selection: Suit3dAssetSelection;
  onReady: () => void;
  onControlStart: () => void;
  onControlChange: () => void;
}) {
  const assetUrls = useMemo(() => getSuit3dAssetUrls(selection), [selection]);
  const fabricMaterial = useSuitMaterial(selection.fabricMaterial);
  const buttonMaterial = useSuitMaterial(selection.buttonMaterial);

  useEffect(() => {
    for (const assetUrl of assetUrls) {
      useGLTF.preload(assetUrl);
    }
  }, [assetUrls]);

  useEffect(() => {
    onReady();
  }, [onReady, selection]);

  return (
    <>
      <group position={[0, -0.34, 0]} rotation={[0, -0.08, 0]} scale={0.76}>
        <ModelAsset asset={selection.assets.base} />
        <ModelAsset
          asset={selection.assets.jacket}
          overrideMaterial={fabricMaterial}
        />
        <ModelAsset
          asset={selection.assets.lapel}
          overrideMaterial={fabricMaterial}
        />
        <ModelAsset
          asset={selection.assets.buttons}
          overrideMaterial={buttonMaterial}
        />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.33, 0]}>
        <circleGeometry args={[0.84, 48]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.9} />
      </mesh>
      <OrbitControls
        enableDamping
        enablePan={false}
        minDistance={2.75}
        maxDistance={5.1}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.62}
        target={[0, 0.42, 0]}
        onStart={onControlStart}
        onChange={onControlChange}
      />
    </>
  );
}

function ModelAsset({
  asset,
  overrideMaterial,
}: {
  asset: Suit3dModelAsset;
  overrideMaterial?: Material;
}) {
  const { scene } = useGLTF(asset.url);
  const overrideMaterialRef = useRef<Material | undefined>(overrideMaterial);
  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.name = asset.rootNodeName;
    clone.traverse((object) => {
      if (!isMesh(object)) {
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;
    });

    return clone;
  }, [asset, scene]);

  useEffect(() => {
    overrideMaterialRef.current = overrideMaterial;

    if (!overrideMaterial) {
      return;
    }

    model.traverse((object) => {
      if (isMesh(object) && asset.meshNames.includes(object.name)) {
        object.material = overrideMaterial;
      }
    });
  }, [asset.meshNames, model, overrideMaterial]);

  useEffect(() => {
    return () => {
      useGLTF.clear(asset.url);
      disposeObject3d(model, (material) => {
        return material === overrideMaterialRef.current;
      });
    };
  }, [asset.url, model]);

  return <primitive object={model} />;
}

function useSuitMaterial(material: Suit3dMaterial) {
  const suitMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        name: material.materialName,
        color: new Color(material.color),
        roughness: material.roughness,
        metalness: material.metalness,
      }),
    [material],
  );

  useEffect(() => {
    return () => suitMaterial.dispose();
  }, [suitMaterial]);

  return suitMaterial;
}

function Suit3dFallback({
  fallback,
  title,
  description,
}: {
  fallback: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div data-testid="suit-3d-fallback" className="space-y-3">
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="text-accent-strong mt-0.5 size-4 shrink-0"
          />
          <div>
            <p className="text-ink text-sm font-semibold">{title}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {description}
            </p>
          </div>
        </div>
      </div>
      {fallback}
    </div>
  );
}

class Suit3dErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function disposeObject3d(
  object: Object3D,
  isProtectedMaterial: (material: Material) => boolean,
) {
  object.traverse((child) => {
    if (!isMesh(child)) {
      return;
    }

    child.geometry.dispose();

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      if (!isProtectedMaterial(material)) {
        material.dispose();
      }
    }
  });

  if (object instanceof Group) {
    object.clear();
  }
}
