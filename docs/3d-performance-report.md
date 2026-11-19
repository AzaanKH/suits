# 3D Performance Report

Measured on the studio assets on November 19, 2026. Byte counts come from the files in `public/models/suit-studio`. Triangle counts come from `assets/suit-studio/parts.json`, which `pnpm assets:studio:build` writes.

## Transfer

Both 3D surfaces load the same files, once per session (drei caches them).

| Asset                                     |         Bytes |
| ----------------------------------------- | ------------: |
| `arden-tailoring-optimized.glb` (Meshopt) |     2,650,228 |
| `textures/wool-albedo.webp`               |       712,456 |
| `textures/single-normal.webp`             |       883,448 |
| `textures/double-normal.webp`             |     1,206,356 |
| `textures/dinner-normal.webp`             |     1,179,388 |
| **Total**                                 | **6,631,876** |

The uncompressed source GLB (11,459,064 bytes) lives in `assets/suit-studio/` and is not deployed.

## Geometry

| Group                                 |   Triangles |
| ------------------------------------- | ----------: |
| `single_*` block                      |     191,584 |
| `double_*` block                      |     106,784 |
| `dinner_*` block                      |     134,576 |
| Shared (trousers, waistcoat, details) |      81,004 |
| **Loaded**                            | **513,948** |

Only one jacket block is visible at a time, so about 190k–270k triangles render. All three blocks still download and stay in GPU memory.

## Runtime behavior

- Both canvases use `frameloop="demand"` and render only when something changes. The studio switches to a continuous loop only while the turntable runs.
- Low-memory, low-core, data-saver, and slow-connection devices get a lower device pixel ratio cap (1.5 instead of 2) and, in the studio, a 512px contact shadow instead of 1024px.
- The studio builds three-mesh-bvh bounds trees (drei `Bvh`) for pointer raycasts. This is a one-time cost after load.
- No WebGL means the 2D preview or a message. A runtime error offers a retry and the 2D preview.

## Improvement candidates

In order of expected payoff:

1. **Split the GLB per jacket block.** Load `single` first and the others on demand. This cuts first-load geometry by roughly 45% and frees GPU memory for blocks the customer never picks.
2. **KTX2 textures.** WebP decodes to full RGBA in GPU memory. KTX2/Basis stays compressed on the GPU, which matters most on phones for the three 1.5k normal maps.
3. **Reduce `single_body`** (110k triangles). A decimated LOD for the preview panel would keep the studio sharp while lightening the default page.
4. **Measure on a real mid-range phone.** These numbers are file measurements, not field timings. Record time to first frame and orbit frame rate before setting budgets.
