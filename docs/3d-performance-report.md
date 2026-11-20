# 3D Performance Report

Measured on the studio assets on November 19, 2026. Byte counts come from the files in `public/models/suit-studio`. Triangle counts are printed by `pnpm assets:studio:split`.

## Transfer

The model is split by jacket block. A visitor first downloads the shared meshes plus the default single-breasted block. The double-breasted and dinner blocks load the first time a selection needs them, or in the background 1.5 s after the suit first renders (skipped when the browser asks to save data). drei caches every file for the session, so both 3D surfaces share them.

| Asset                         | When                    |         Bytes |
| ----------------------------- | ----------------------- | ------------: |
| `suit-core.glb` (Meshopt)     | First render            |     1,041,232 |
| `textures/wool-albedo.webp`   | First render            |       712,456 |
| `textures/single-normal.webp` | First render            |       883,448 |
| **First render**              |                         | **2,637,136** |
| `suit-double.glb`             | Background or on demand |       452,444 |
| `textures/double-normal.webp` | Background or on demand |     1,206,356 |
| `suit-dinner.glb`             | Background or on demand |       567,680 |
| `textures/dinner-normal.webp` | Background or on demand |     1,179,388 |
| **Everything**                |                         | **6,043,004** |

Before the split, the first render needed all 6,631,876 bytes. It now needs 60% less. The total also dropped, because two lapel meshes that no selection can show (`single_lapel_shawl`, `double_lapel_shawl`) are no longer exported.

The studio route also loads `postprocessing` and N8AO for ambient occlusion: one lazily loaded chunk of about 136 KB gzipped, only on `/studio`.

## Geometry

| File              |   Triangles |
| ----------------- | ----------: |
| `suit-core.glb`   |     262,028 |
| `suit-double.glb` |      98,688 |
| `suit-dinner.glb` |     134,576 |
| **All blocks**    | **495,292** |

`suit-core.glb` holds the shared meshes (trousers, waistcoat, trouser details, shirt buttons) plus the single-breasted block. One jacket block is visible at a time, so 180k–260k triangles render.

## Runtime behavior

- Both canvases use `frameloop="demand"` and render only when something changes. The studio switches to a continuous loop only while the turntable runs.
- Switching to a block that has not loaded yet keeps the current suit on screen until the download finishes (`useDeferredValue` in `TailoredSuit`); it never blanks to a loading state.
- The studio renders through an `EffectComposer` with N8AO (half resolution) and ACES tone mapping. Low-memory, low-core, data-saver, and slow-connection devices skip the composer, cap device pixel ratio at 1.5 instead of 2, and get a 512px contact shadow instead of 1024px.
- Each model piece builds three-mesh-bvh bounds trees for pointer raycasts when it mounts. Clones share geometry, so each geometry is indexed once.
- No WebGL means the 2D preview or a message. A runtime error offers a retry and the 2D preview.

## Improvement candidates

In order of expected payoff:

1. **KTX2 textures.** The three normal maps are 3.3 MB of WebP and decode to full RGBA in GPU memory. KTX2/Basis stays compressed on the GPU, which matters most on phones.
2. **Reduce `single_body`** (110k triangles, the largest mesh in the first download). A decimated version for the preview panel would keep the studio sharp while lightening the default page.
3. **Measure on a real mid-range phone.** These numbers are file measurements, not field timings. Record time to first frame and orbit frame rate, with and without the AO composer, before setting budgets.
