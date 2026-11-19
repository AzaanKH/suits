# 3D Asset Performance Report

Measured on the Blender-generated modular assets in `public/models/suit-configurator` after running `pnpm assets:3d:generate && pnpm assets:3d:validate`.

## Asset Size Baseline

Before the 3D configurator, the customizer loaded no `.glb` assets.

| Asset set | Before | After |
| --- | ---: | ---: |
| 3D assets on disk | 0 bytes | 852,112 bytes |
| Default 3D selection transfer | 0 bytes | 276,108 bytes |

The default selection transfer is `base/mannequin.glb`, `jackets/single-breasted-two-button.glb`, `lapels/notch-lapel.glb`, `buttons/horn-buttons.glb`, `pockets/straight-flap-pockets.glb`, and `trousers/side-adjusters.glb`.

## Generated Asset Sizes

| Asset | Bytes |
| --- | ---: |
| `base/mannequin.glb` | 79,000 |
| `buttons/covered-buttons.glb` | 115,784 |
| `buttons/horn-buttons.glb` | 93,372 |
| `buttons/smoked-pearl-buttons.glb` | 93,492 |
| `jackets/double-breasted-six-button.glb` | 46,868 |
| `jackets/single-breasted-one-button.glb` | 36,732 |
| `jackets/single-breasted-two-button.glb` | 36,732 |
| `lapels/notch-lapel.glb` | 19,848 |
| `lapels/peak-lapel.glb` | 20,044 |
| `lapels/shawl-lapel.glb` | 15,368 |
| `pockets/jetted-pockets.glb` | 10,884 |
| `pockets/patch-pockets.glb` | 10,808 |
| `pockets/slanted-flap-pockets.glb` | 11,020 |
| `pockets/straight-flap-pockets.glb` | 10,912 |
| `trousers/belt-loops.glb` | 49,528 |
| `trousers/brace-buttons.glb` | 51,828 |
| `trousers/side-adjusters.glb` | 36,244 |
| `trousers/single-pleat-trousers.glb` | 36,152 |
| `vests/matching-waistcoat.glb` | 77,496 |

## Runtime Measurements

The 3D preview records browser performance entries:

- `suit-3d-initial-load`: starts when the 3D tab mounts and ends after the selected GLBs resolve and the scene commits.
- `suit-3d-first-orbit-response`: starts on first orbit interaction and ends on the first orbit change event.

The preview also displays the measured load and first orbit response values in the 3D panel footer when available.

## Desktop And Mobile Behavior

- Desktop uses antialiasing and a device pixel ratio up to 1.5.
- Mobile, low-memory, low-core, data-saver, slow-connection, or reduced-motion contexts use simplified rendering: DPR 1, lower power preference, and antialiasing disabled.
- If WebGL is unavailable, the 3D panel shows the 2D preview fallback and leaves the rest of the customizer usable.
- Scene instances borrow loader-cached geometry without disposing shared resources. Runtime materials and textures dispose independently when no longer used.

## Compression Decision

No Draco, Meshopt, or KTX2 compression is enabled because the current geometry-only default selection is 276,108 bytes. Re-evaluate compression after denser production meshes or texture payloads exist.
