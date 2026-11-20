# 3D Suit Studio

The House Suit (`house-navy-hopsack-suit`) has two 3D surfaces that share one model, one material set, and the customizer store:

| Surface            | Route                      | Purpose                                                                                                                                                                            |
| ------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview panel      | `/customize/[productSlug]` | The lightweight default. Orthographic camera, four fixed views, sits beside the full option flow.                                                                                  |
| Full-screen studio | `/studio/[productSlug]`    | The immersive editor. Perspective camera, click a garment part to edit it, camera flies to the part, lighting moods, turntable, photo export. Covers the visual design steps only. |

Fit, construction details, and checkout stay in the customizer. The studio's **Continue to details** button returns there with the configuration intact, because `useCustomizerStore.initialize` keeps an existing configuration for the same product.

Both surfaces are disabled when `ENABLE_3D_CONFIGURATOR=false`. The customizer then shows the 2D preview, and `/studio/*` redirects to the customizer. Unsupported products, missing WebGL, or a runtime error fall back to the 2D preview or a message.

## Code map

| File                                                            | Responsibility                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/customizer/three-d/suit-selection.ts`             | Turns a configuration into visual selections and decides which jacket block and meshes show. No pricing.                                          |
| `src/features/customizer/three-d/suit-model.tsx`                | Loads the GLBs and textures, applies visibility, owns materials, lighting moods, hover outlines, and the error boundary. Shared by both surfaces. |
| `src/features/customizer/three-d/suit-parts.ts`                 | Maps mesh names to the customizer step that edits them. Drives click-to-edit and camera framing.                                                  |
| `src/features/customizer/three-d/suit-3d-preview.tsx`           | Preview panel shell.                                                                                                                              |
| `src/features/customizer/three-d/suit-studio-canvas.tsx`        | Studio scene: camera controls, fly-to, podium, ambient occlusion, hover tooltip, photo capture.                                                   |
| `src/features/customizer/components/suit-studio-experience.tsx` | Studio page UI: top bar, tools, options panel.                                                                                                    |
| `src/features/customizer/components/option-steps.tsx`           | Fabric and option pickers, shared by the customizer and the studio.                                                                               |

Pricing stays in `src/features/customizer/pricing.ts`. The scene only receives visual selections.

## Model contract

The model ships as three Meshopt-compressed GLBs in `public/models/suit-studio/`, one per jacket block, plus WebP textures:

| File              | Contents                                                                      | Loaded                                       |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| `suit-core.glb`   | Shared meshes (trousers, waistcoat, trouser details) and the `single_*` block | Always, with the wool and single normal maps |
| `suit-double.glb` | The `double_*` block                                                          | On demand or in the background               |
| `suit-dinner.glb` | The `dinner_*` block                                                          | On demand or in the background               |

`TailoredSuit` renders the core model plus the active block inside one group. A selection toggles `visible` on named meshes; only a block swap can trigger a download. The block comes from a deferred copy of the selection (`useDeferredValue`), so while a block downloads the previous suit stays on screen instead of falling back to the Suspense loader. Visibility rules live in `isSuitMeshVisible` and `getSuitBlock` in `suit-selection.ts`, with unit tests.

Mesh names follow `<block>_<part>[_<variant>]`:

- **Blocks:** `single_*` (single-breasted), `double_*` (double-breasted), `dinner_*` (shawl-lapel dinner jacket). Only one block is visible at a time.
- **Parts:** `body`, `cuff`, `collar`, `lapel_{notch,peak,shawl}`, `pocket_{flap,slanted,welt,patch}`, `breast`, `button_N`, `buttonhole`, `shirt_N`.
- **Shared, block-independent meshes:** `trousers`, `pleat_*`, `waist_loop_*`, `waist_adjuster_*`, `waistcoat`, `vest_button_*`, `shirt_button_*`.

Material slots come from the Blender material name stored on each mesh: `Cloth`, `Lapel`, `Trouser`, `Waistcoat`, `Shirt`, `Button`, `Lining`. Cloth and lapel slots get a `Double` or `Dinner` suffix at runtime so each block uses its own normal map.

**When you add or rename meshes, keep this pattern.** `suit-parts.ts` derives click targets from it, and `suit-parts.test.ts` pins the mapping. A new part needs a case there and in `isSuitMeshVisible` (with a test in `suit-selection.test.ts`). The split script puts a mesh in a file by its block prefix.

Rendering notes:

- Hidden meshes move to layer 31. three.js raycasts invisible meshes, so without this a click could select a hidden jacket block.
- Materials are created once per texture set; selection changes update uniforms only. A block's normal map is assigned to its `Cloth*`/`Lapel*` materials when the block loads.
- The suit is a hollow shell. Double-sided materials scale the light on back faces (`shadeInterior` in `suit-model.tsx`) so collar, cuff, and hem openings read as shaded interiors instead of bright holes.
- The studio renders through `@react-three/postprocessing` with N8AO ambient occlusion and an ACES `ToneMapping` effect (the composer's linear buffer skips the renderer's own tone mapping). Two consequences, handled by `SuitLighting postProcessed`: the background color is pre-compensated through the inverse ACES curve so it still matches the page, and drei `ContactShadows` is dropped because its depth pass renders as light blotches under the composer. The AO grounds the hems instead.
- The studio uses `frameloop="demand"`. Anything that moves the camera outside a pointer event must call `invalidate()`.
- drei 10.7.9's `Outlines` has its `screenspace` shader branches swapped. `screenspace={false}` is the pixel-width path. Re-check this when upgrading drei.

## Asset pipeline

Sources live in `assets/suit-studio/` and are tracked with Git LFS (`.gitattributes`). See `assets/suit-studio/README.md` for provenance and the CC0 license.

```bash
pnpm assets:studio:build      # Blender: builds arden-studio.blend, assets/suit-studio/arden-tailoring.glb, parts.json, model-review.png
pnpm assets:studio:textures   # sharp: source PNGs -> public/models/suit-studio/textures/*.webp
pnpm assets:studio:split      # glTF-Transform: raw GLB -> suit-core/double/dinner.glb (Meshopt)
```

After regenerating the GLBs or textures, bump `ASSET_VERSION` in `suit-model.tsx` so browsers do not serve cached copies.

## Limits

This is a visualization model adapted from a CC0 MakeHuman suit, not a pattern-derived garment. It does not predict fit or drape. Lining color, measurements, and unmodeled construction details are recorded as specification requests. See [research-fully-customizable-3d-suit.md](research-fully-customizable-3d-suit.md) for the path to production-grade garments, and [3d-performance-report.md](3d-performance-report.md) for payload numbers.
