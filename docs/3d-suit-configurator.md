# 3D Suit Configurator Proof Of Concept

The first 3D pass is scoped to `house-navy-hopsack-suit`. It is a client-only preview island that reads the same Zustand customizer state as the 2D selector and never calculates pricing.

The preview is hidden by default behind `ENABLE_3D_CONFIGURATOR=true`. Keep this flag off until production-quality GLB assets replace the generated proof meshes.

## Production GLB Assets Required

This scaffold is not ready to expose to customers until real modular `.glb` assets are supplied. The generated proof files in `public/models/suit-configurator` exist only to validate loading, state mapping, fallback behavior, and performance measurement.

Before enabling `ENABLE_3D_CONFIGURATOR=true`, replace the proof files with production-quality assets that satisfy the named mesh contract below.

## Runtime Contract

- The 2D customizer remains the default preview.
- The 3D tab is rendered only when `ENABLE_3D_CONFIGURATOR=true`.
- The 3D bundle is lazy-loaded only after the user selects the `3D` preview tab.
- Unsupported products, missing WebGL, reduced device capacity, or runtime errors fall back to the existing 2D preview.
- The scene reads `useCustomizerStore()` for the active configuration and uses `src/features/customizer/three-d/asset-contract.ts` to map stable option codes to GLB assets and materials.
- Business pricing stays in `src/features/customizer/pricing.ts`; the 3D scene receives only visual asset and material selections.

## Asset Layout

```text
public/models/suit-configurator/
  base/mannequin.glb
  jackets/single-breasted-two-button.glb
  jackets/single-breasted-one-button.glb
  jackets/double-breasted-six-button.glb
  lapels/notch-lapel.glb
  lapels/peak-lapel.glb
  lapels/shawl-lapel.glb
  buttons/horn-buttons.glb
  buttons/smoked-pearl-buttons.glb
  buttons/covered-buttons.glb
```

The proof loads only the base mannequin plus the currently selected jacket, lapel, and button asset. Fabric changes reuse the selected geometry and swap materials in React Three Fiber.

## Named Meshes

| Option code                  | GLB                                      | Required mesh names                                                                                             |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `house-mannequin-base`       | `base/mannequin.glb`                     | `Mannequin_Base`, `Mannequin_Head`, `Mannequin_Stand`                                                           |
| `single-breasted-two-button` | `jackets/single-breasted-two-button.glb` | `Jacket_SingleBreastedTwoButton`, `Sleeve_Left_SingleBreastedTwoButton`, `Sleeve_Right_SingleBreastedTwoButton` |
| `single-breasted-one-button` | `jackets/single-breasted-one-button.glb` | `Jacket_SingleBreastedOneButton`, `Sleeve_Left_SingleBreastedOneButton`, `Sleeve_Right_SingleBreastedOneButton` |
| `double-breasted-six-button` | `jackets/double-breasted-six-button.glb` | `Jacket_DoubleBreastedSixButton`, `Sleeve_Left_DoubleBreastedSixButton`, `Sleeve_Right_DoubleBreastedSixButton` |
| `notch-lapel`                | `lapels/notch-lapel.glb`                 | `Lapel_Left_Notch`, `Lapel_Right_Notch`                                                                         |
| `peak-lapel`                 | `lapels/peak-lapel.glb`                  | `Lapel_Left_Peak`, `Lapel_Right_Peak`                                                                           |
| `shawl-lapel`                | `lapels/shawl-lapel.glb`                 | `Lapel_Left_Shawl`, `Lapel_Right_Shawl`                                                                         |
| `horn-buttons`               | `buttons/horn-buttons.glb`               | `Buttons_Horn_1`, `Buttons_Horn_2`                                                                              |
| `smoked-pearl-buttons`       | `buttons/smoked-pearl-buttons.glb`       | `Buttons_SmokedPearl_1`, `Buttons_SmokedPearl_2`                                                                |
| `covered-buttons`            | `buttons/covered-buttons.glb`            | `Buttons_Covered_1`, `Buttons_Covered_2`, `Buttons_Covered_3`, `Buttons_Covered_4`                              |

## Blender Export Workflow

1. Model each suit component as a separate collection matching the modular asset type: `base`, `jacket`, `lapel`, or `buttons`.
2. Name every renderable mesh exactly as listed in the contract. Keep parent collection names aligned with `rootNodeName` values in `asset-contract.ts`.
3. Apply transforms before export: `Ctrl+A` then rotation, scale, and location where appropriate.
4. Keep origin points consistent at world center so modular files align when loaded together.
5. Use a shared material slot named `Fabric_OverrideSlot` for jacket and lapel meshes that should receive runtime fabric color.
6. Use a shared material slot named `Button_OverrideSlot` for button meshes that should receive runtime button material.
7. Reduce polygon count before export where silhouette quality is unchanged. Prefer clean topology and normal smoothing over dense subdivision.
8. Compress raster textures before export. Prefer 1K textures for proof assets and only use 2K where close-up detail requires it.
9. Evaluate KTX2 textures once real fabric textures are introduced. Keep the proof color-only until texture benchmarks justify the payload.
10. Export as glTF binary (`.glb`) with selected objects only, visible objects only, +Y up, and no embedded cameras or lights.
11. Run `pnpm assets:3d:poc` only to regenerate placeholder proof assets. Production Blender exports should replace the matching files directly.

## Compression Plan

- Current proof assets are uncompressed GLB files because they are geometry-only and small.
- Evaluate Draco and Meshopt after real Blender assets land. Benchmark both with the same selected default load set and compare:
  - initial 3D tab time to first rendered frame,
  - total transferred bytes,
  - decode time on a mid-range mobile device,
  - orbit responsiveness after decode.
- Adopt compression only when byte savings are greater than decode cost for the selected suit path.

## Incremental Scope

After this proof is stable, add trousers, pockets, vest options, lining, and additional fabrics as separate GLB modules. Add environment maps, camera presets, and screenshot generation after the expanded asset contract remains stable.
