# 3D Proof Performance Report

Measured on the generated proof assets in `public/models/suit-configurator` after running `pnpm assets:3d:poc`.

## Asset Size Baseline

Before this proof, the customizer loaded no `.glb` assets.

| Asset set                     |  Before |         After |
| ----------------------------- | ------: | ------------: |
| 3D assets on disk             | 0 bytes | 195,644 bytes |
| Default 3D selection transfer | 0 bytes |  86,752 bytes |

The default selection transfer is `base/mannequin.glb`, `jackets/single-breasted-two-button.glb`, `lapels/notch-lapel.glb`, and `buttons/horn-buttons.glb`.

## Generated Asset Sizes

| Asset                                    |  Bytes |
| ---------------------------------------- | -----: |
| `base/mannequin.glb`                     | 45,972 |
| `buttons/covered-buttons.glb`            | 22,384 |
| `buttons/horn-buttons.glb`               | 11,424 |
| `buttons/smoked-pearl-buttons.glb`       | 11,452 |
| `jackets/double-breasted-six-button.glb` | 27,212 |
| `jackets/single-breasted-one-button.glb` | 27,136 |
| `jackets/single-breasted-two-button.glb` | 27,140 |
| `lapels/notch-lapel.glb`                 |  2,216 |
| `lapels/peak-lapel.glb`                  |  2,268 |
| `lapels/shawl-lapel.glb`                 | 18,440 |

## Runtime Measurements

The 3D preview records browser performance entries:

- `suit-3d-initial-load`: starts when the 3D tab mounts and ends after the selected GLBs resolve and the scene commits.
- `suit-3d-first-orbit-response`: starts on first orbit interaction and ends on the first orbit change event.

The preview also displays the measured load and first orbit response values in the 3D panel footer when available.

## Desktop And Mobile Behavior

- Desktop uses antialiasing and a device pixel ratio up to 1.5.
- Mobile, low-memory, low-core, data-saver, slow-connection, or reduced-motion contexts use simplified rendering: DPR 1, lower power preference, and antialiasing disabled.
- If WebGL is unavailable, the 3D panel shows the 2D preview fallback and leaves the rest of the customizer usable.
- The scene clears Drei GLTF caches and disposes cloned geometry/materials when the selected GLB URL changes or the preview unmounts.

## Compression Decision

No Draco, Meshopt, or KTX2 compression is enabled for the proof because the current geometry-only default selection is 86,752 bytes. Re-evaluate compression after real Blender exports and texture payloads exist.
