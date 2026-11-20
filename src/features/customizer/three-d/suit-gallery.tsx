"use client";

import { Grid, Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { MathUtils, type Group } from "three";

import { TailoredSuit, type SuitMood } from "./suit-model";
import { getGalleryPlacement } from "./suit-gallery-designs";
import type { Suit3dSelection } from "./suit-selection";

export type GallerySuitView = {
  id: string;
  name: string;
  sourceLabel: string;
  selection: Suit3dSelection;
};

const HIDDEN_Y = -2.6;

const FLOOR_COLORS: Record<SuitMood, { cell: string; section: string }> = {
  atelier: { cell: "#d3d9e6", section: "#9fb0d6" },
  daylight: { cell: "#d6dde6", section: "#a7b6cf" },
  evening: { cell: "#232a36", section: "#34446a" },
};

export function StudioFloor({ mood, wide }: { mood: SuitMood; wide: boolean }) {
  const floor = FLOOR_COLORS[mood];
  return (
    <Grid
      position={[0, -0.061, 0]}
      args={[40, 40]}
      infiniteGrid
      cellSize={0.25}
      cellThickness={0.6}
      cellColor={floor.cell}
      sectionSize={1}
      sectionThickness={1}
      sectionColor={floor.section}
      fadeFrom={0}
      fadeDistance={wide ? 9 : 3.2}
      fadeStrength={1.6}
    />
  );
}

export function SuitGallery({
  designs,
  revealed,
  inspectedId,
  mood,
  reducedMotion,
  onInspect,
}: {
  designs: GallerySuitView[];
  revealed: boolean;
  inspectedId: string | null;
  mood: SuitMood;
  reducedMotion: boolean;
  onInspect: (id: string) => void;
}) {
  return (
    <>
      {designs.map((design, index) => (
        <Suspense key={design.id} fallback={null}>
          <GallerySuit
            design={design}
            index={index}
            count={designs.length}
            revealed={revealed}
            inspected={design.id === inspectedId}
            mood={mood}
            reducedMotion={reducedMotion}
            onInspect={onInspect}
          />
        </Suspense>
      ))}
    </>
  );
}

function GallerySuit({
  design,
  index,
  count,
  revealed,
  inspected,
  mood,
  reducedMotion,
  onInspect,
}: {
  design: GallerySuitView;
  index: number;
  count: number;
  revealed: boolean;
  inspected: boolean;
  mood: SuitMood;
  reducedMotion: boolean;
  onInspect: (id: string) => void;
}) {
  const ref = useRef<Group>(null);
  const revealedAt = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const { position, rotationY } = getGalleryPlacement(index, count);

  useEffect(() => {
    revealedAt.current = performance.now();
    if (!revealed) document.body.style.cursor = "";
    invalidate();
  }, [revealed, invalidate]);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    const target = revealed ? 0 : HIDDEN_Y;
    const waiting =
      revealed &&
      !reducedMotion &&
      performance.now() - revealedAt.current < index * 110;
    if (!waiting) {
      group.position.y = reducedMotion
        ? target
        : MathUtils.damp(group.position.y, target, 5, Math.min(delta, 0.1));
    }
    group.visible = group.position.y > HIDDEN_Y + 0.02;
    if (Math.abs(group.position.y - target) > 0.002) state.invalidate();
    else group.position.y = target;
  });

  const inspect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6) return;
    onInspect(design.id);
  };

  return (
    <group
      ref={ref}
      position={[position[0], HIDDEN_Y, position[2]]}
      rotation={[0, rotationY, 0]}
      visible={false}
    >
      <TailoredSuit selection={design.selection} />
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.66, 0.08, 64]} />
        <meshStandardMaterial
          color={mood === "evening" ? "#2a313d" : "#dcded6"}
          roughness={0.9}
        />
      </mesh>
      {revealed ? (
        <mesh
          position={[0, 0.85, 0]}
          visible={false}
          onClick={inspect}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <cylinderGeometry args={[0.5, 0.5, 1.8, 12]} />
        </mesh>
      ) : null}
      {revealed ? (
        <Html position={[0, 1.86, 0]} center zIndexRange={[1, 0]}>
          <button
            type="button"
            className="atelier-floor-tag"
            data-inspected={inspected}
            onClick={() => onInspect(design.id)}
          >
            <span>{design.name}</span>
            <small>{design.sourceLabel}</small>
          </button>
        </Html>
      ) : null}
    </group>
  );
}
