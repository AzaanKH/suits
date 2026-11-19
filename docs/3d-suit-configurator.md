# 3D Suit Configurator Assets

The 3D preview is scoped to `house-navy-hopsack-suit`. It is a client-only preview island that reads the same Zustand customizer state as the 2D selector and never calculates pricing. The asset set is geometry-first and intentionally stylized for a fast, editorial tailoring preview: shaped jacket shells, bent sleeves, tapered trousers, layered lapels, pockets, buttons, and an optional waistcoat.

The preview is enabled by default for the supported House Suit; set `ENABLE_3D_CONFIGURATOR=false` to disable it, and the asset set covers the modular suit pieces needed by the customizer: mannequin, jacket shell, lapels, buttons, pockets, trousers, and the optional matching waistcoat.

## Runtime Contract

- The House Suit opens in 3D by default; unsupported products use 2D.
- The 3D tab is available for supported products unless `ENABLE_3D_CONFIGURATOR=false`.
- The 3D bundle loads when its tab is active, including the initial supported-product view.
- Unsupported products, missing WebGL, reduced device capacity, or runtime errors fall back to the existing 2D preview.
- The scene reads `useCustomizerStore()` for the active configuration and uses `src/features/customizer/three-d/asset-contract.ts` to map stable option codes to GLB assets and materials.
- Asset metadata is centralized in `src/features/customizer/three-d/asset-manifest.json` so the app, Blender generator, and validator share the same mesh contract.
- Business pricing stays in `src/features/customizer/pricing.ts`; the 3D scene receives only visual asset and material selections.

## Asset Layout

```text
assets/suit-configurator/blender/
  base/mannequin.blend
  jackets/*.blend
  lapels/*.blend
  buttons/*.blend
  pockets/*.blend
  trousers/*.blend
  vests/*.blend

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
  pockets/straight-flap-pockets.glb
  pockets/slanted-flap-pockets.glb
  pockets/patch-pockets.glb
  pockets/jetted-pockets.glb
  trousers/side-adjusters.glb
  trousers/belt-loops.glb
  trousers/single-pleat-trousers.glb
  trousers/brace-buttons.glb
  vests/matching-waistcoat.glb
```

The runtime loads only the base mannequin plus the assets selected by the active configuration. Fabric changes reuse selected geometry and swap materials in React Three Fiber.

## Material Slots

Meshes that receive runtime colors must use these material names in Blender:

| Slot                 | Runtime use                       |
| -------------------- | --------------------------------- |
| `Fabric_OverrideSlot` | Jacket, lapel, pocket, trouser, and vest fabric |
| `Button_OverrideSlot` | Jacket buttons, brace buttons, and vest buttons |
| `Lining_OverrideSlot` | Jacket and waistcoat lining surfaces |

The scene also falls back to material-name detection for future assets, but explicit `materialSlots` in the manifest are preferred because they are validated.

## Named Meshes

The source of truth is `src/features/customizer/three-d/asset-manifest.json`. The validator checks each GLB for the root node, required mesh nodes, and expected material slots.

| Option code | GLB | Required mesh names |
| --- | --- | --- |
| `house-mannequin-base` | `base/mannequin.glb` | `Mannequin_Base`, `Mannequin_Head`, `Mannequin_Stand` |
| `single-breasted-two-button` | `jackets/single-breasted-two-button.glb` | `Jacket_SingleBreastedTwoButton`, `Sleeve_Left_SingleBreastedTwoButton`, `Sleeve_Right_SingleBreastedTwoButton`, `Lining_Jacket_SingleBreastedTwoButton` |
| `single-breasted-one-button` | `jackets/single-breasted-one-button.glb` | `Jacket_SingleBreastedOneButton`, `Sleeve_Left_SingleBreastedOneButton`, `Sleeve_Right_SingleBreastedOneButton`, `Lining_Jacket_SingleBreastedOneButton` |
| `double-breasted-six-button` | `jackets/double-breasted-six-button.glb` | `Jacket_DoubleBreastedSixButton`, `Sleeve_Left_DoubleBreastedSixButton`, `Sleeve_Right_DoubleBreastedSixButton`, `Lining_Jacket_DoubleBreastedSixButton` |
| `notch-lapel` | `lapels/notch-lapel.glb` | `Lapel_Left_Notch`, `Lapel_Right_Notch` |
| `peak-lapel` | `lapels/peak-lapel.glb` | `Lapel_Left_Peak`, `Lapel_Right_Peak` |
| `shawl-lapel` | `lapels/shawl-lapel.glb` | `Lapel_Left_Shawl`, `Lapel_Right_Shawl` |
| `horn-buttons` | `buttons/horn-buttons.glb` | `Buttons_Horn_1`, `Buttons_Horn_2` |
| `smoked-pearl-buttons` | `buttons/smoked-pearl-buttons.glb` | `Buttons_SmokedPearl_1`, `Buttons_SmokedPearl_2` |
| `covered-buttons` | `buttons/covered-buttons.glb` | `Buttons_Covered_1`, `Buttons_Covered_2`, `Buttons_Covered_3`, `Buttons_Covered_4` |
| `straight-flap-pockets` | `pockets/straight-flap-pockets.glb` | `Pocket_Left_StraightFlap`, `Pocket_Right_StraightFlap` |
| `slanted-flap-pockets` | `pockets/slanted-flap-pockets.glb` | `Pocket_Left_SlantedFlap`, `Pocket_Right_SlantedFlap` |
| `patch-pockets` | `pockets/patch-pockets.glb` | `Pocket_Left_Patch`, `Pocket_Right_Patch` |
| `jetted-pockets` | `pockets/jetted-pockets.glb` | `Pocket_Left_Jetted`, `Pocket_Right_Jetted` |
| `side-adjusters` | `trousers/side-adjusters.glb` | `Trouser_Left_SideAdjusters`, `Trouser_Right_SideAdjusters`, `Waistband_SideAdjusters` |
| `belt-loops` | `trousers/belt-loops.glb` | `Trouser_Left_BeltLoops`, `Trouser_Right_BeltLoops`, `Waistband_BeltLoops`, `BeltLoop_Left_BeltLoops`, `BeltLoop_Right_BeltLoops` |
| `single-pleat-trousers` | `trousers/single-pleat-trousers.glb` | `Trouser_Left_SinglePleat`, `Trouser_Right_SinglePleat`, `Waistband_SinglePleat`, `Pleat_Left_SinglePleat`, `Pleat_Right_SinglePleat` |
| `brace-buttons` | `trousers/brace-buttons.glb` | `Trouser_Left_BraceButtons`, `Trouser_Right_BraceButtons`, `Waistband_BraceButtons`, `BraceButton_Left_BraceButtons`, `BraceButton_Right_BraceButtons` |
| `matching-waistcoat` | `vests/matching-waistcoat.glb` | `Vest_MatchingWaistcoat`, `Vest_Lining_MatchingWaistcoat`, `Vest_Button_1`, `Vest_Button_2`, `Vest_Button_3`, `Vest_Button_4`, `Vest_Button_5` |

## Blender Workflow

1. Edit `src/features/customizer/three-d/asset-manifest.json` first when adding or renaming an asset.
2. Run `pnpm assets:3d:generate` to create `.blend` source files and exported `.glb` files from Blender.
3. Run `pnpm assets:3d:validate` to verify source files, exported root nodes, required mesh names, and material slots.
4. Keep origins aligned at world center so modular GLBs stack without per-option transforms.
5. Apply transforms before export. The generator does this automatically for generated meshes.
6. Export glTF binary (`.glb`) with selected objects only, visible objects only, no cameras, and no lights.
7. Keep the geometry color-only until fabric textures justify the extra payload.

## Visual Quality And Compression

- The Blender source uses layered, reusable geometry rather than primitive boxes so each option remains swappable without a monolithic model.
- Runtime materials add a small procedural weave texture and studio lighting while keeping the GLBs texture-free and fast to load.
- Current Blender assets are uncompressed GLB files because the selected load path remains small enough without a decode cost.
- Evaluate Draco and Meshopt after real fabric textures or denser production meshes land. Benchmark both with the same selected default load set and compare:
  - initial 3D tab time to first rendered frame,
  - total transferred bytes,
  - decode time on a mid-range mobile device,
  - orbit responsiveness after decode.
- Adopt compression only when byte savings are greater than decode cost for the selected suit path.

## Incremental Scope

Future improvements can add real cloth topology, fabric normal/roughness maps, lining choices, cuff buttonhole geometry, monogram placement, environment maps, camera presets, and screenshot generation. Keep each addition modular and update the manifest before changing runtime loading behavior.

See [Broad tailoring catalog](tailoring-catalog.md) for the new Details step, maker-review requirements, and precise preview coverage.
