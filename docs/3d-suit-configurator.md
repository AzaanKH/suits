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
| `src/features/customizer/three-d/suit-gallery-designs.ts`       | The studio floor's designs (house picks and the visitor's saved designs) and the ring layout around the visitor's suit.                           |
| `src/features/customizer/three-d/suit-gallery.tsx`              | The studio floor scene: suits rising onto podiums, the chalk-grid floor, swing-ticket tags, cheap click targets.                                  |
| `src/features/customizer/components/studio-floor.tsx`           | The invitation to look around, the floor panel (list, inspect, "Wear this design"), the spec ticket, and saved-design loading.                    |

Pricing stays in `src/features/customizer/pricing.ts`. The scene only receives visual selections.

## Inside view

The Pockets step has a ticket pocket choice, an interior pockets choice (standard: both chest pockets and a pen pocket; travel adds a lower pair; minimal: the left chest pocket; none) and a **View inside** toggle. Both are Details requests (`ticket-pocket`, `inside-pockets`), so they are saved with the design and do not change the price. Choosing interior pockets turns View inside on; leaving the step turns it off.

View inside turns the camera to face the jacket's back and clips every suit material at z = 0.02 (`INSIDE_CLIP` in `suit-model.tsx`), so the back half is cut away and the lining of the front panels shows. It also hides the shirt, cuffs, trousers, waistcoat and the outside pockets, whose backs sit at the cloth surface and would print through, and raises the interior light from 0.45 to 1. The hover outline uses the same clip, and pointing ignores clipped-away hits.

## The studio floor

After the visitor has made a few changes (three changes and 25 s, or 90 s regardless; once per browser session), a note invites them to look around. Turning the camera, or "Show me", raises a lineup of other suits in an arc just behind the visitor's own (4 m away, facing it): the house picks in `HOUSE_PICKS`, plus up to three of the signed-in visitor's saved designs for the same suit (four suits in total on low-power devices). Clicking a suit or its tag walks the camera up to it; "Wear this design" replaces the visitor's design through `wearDesign` in the customizer store. House picks keep the visitor's fit and personal details; saved designs come back as saved.

- `/studio/<suit>?explore` sends the invitation immediately. E2E tests use it.
- House picks must use only cloths and options the House Suit offers. `suit-gallery-designs.test.ts` fails if a seed change would make a pick render differently from what "Wear this design" produces.
- They are curated, not ranked. Showing genuinely popular designs needs an aggregate over orders or saved designs in Convex.
- While the floor is open the camera stays in the front half of the room (azimuth ±90°), so it can never walk into the lineup. A chalk-grid floor sits under the visitor's suit at all times and spreads wider when the lineup appears.
- Each floor suit is a full `TailoredSuit` (geometry shared, materials per suit). Clicks hit an invisible cylinder per suit, never the 200k-triangle meshes.

## Home page hero

The two hero images (`public/images/studio-suit.webp` and `studio-suit-dark.webp`) are renders of the real studio, one per theme. Re-render them with `pnpm assets:hero` while the app is running whenever the model, materials, lighting, floor or default suit change.

## Build-script fitting

`scripts/build-suit-studio.py` repairs and fits parts the source model gets wrong:

- **Pocket openings.** The source cuts each hip-pocket flap and its bag out of the jacket body. `keep_pocket_cloth` copies those faces out, fills the hole in the low-poly body before subdivision, and lays the fill and its rim on a surface fitted to the clean cloth around it, so no style leaves a gap or a ridge. `close_cuts` closes two small dart openings in the dinner and double-breasted bodies.
- **Pockets.** Every hip-pocket style (`pocket_flap`, `pocket_slanted`, `pocket_welt`, `pocket_patch`) is a panel built by `pocket_panel`: shaped in front view, laid on the cloth with at least 0.6 mm clearance, smoothed so seams do not print through, and dropped where there is no front cloth beneath it. The studio draws them with the `PocketPanel` material: the woven cloth without the body's normal map.
- **Ticket and inside pockets.** `pocket_panel` also takes explicit frames. The ticket pocket (`ticket_flap`, `ticket_jetted`) sits on the wearer's right, 4 cm above the hip flap; on the double-breasted it starts clear of the overlapping front edge. Inside pockets are jetted openings on the lining side (`inside=True`): lips 4–5 mm behind the cloth and a dark `Pocketing` mouth on top, named `inpocket_{chest_l,chest_r,pen,lower_l,lower_r}` plus `_mouth`. They stop at |x| = 0.145 (0.13 for the lower pair), before the front curves round to the side seams.
- **Buttons.** `seat` sets every jacket and shirt button on the cloth beneath it, oriented outward from the centre line. The single-breasted and dinner front buttons sit on the under forepart, clear of the overlapping front edge.

`src/features/customizer/three-d/suit-geometry.test.ts` checks the shipped GLBs for these defects: buttons off or under the cloth, see-through openings, pockets sunk, floating or holed, and gross bulges around the pockets. Run it after every rebuild. `tests/e2e/studio-visual.spec.ts` checks that buttons and pockets can be pointed at that the trousers step shows only the trousers, that hovering the jacket outlines no folds around the pocket flaps, and that the ticket and inside pockets can be shown and pointed at; it uses `window.__ardenStudio.screenPoint`, which the studio exposes only when a page sets `window.__ARDEN_TEST__`.

Raycasts use three-mesh-bvh only for meshes of 20,000 triangles or more. On the small pocket panels it missed faces that three.js's own raycast finds, so the pockets could not be pointed at.

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
- **Parts:** `body`, `cuff`, `collar`, `lapel_{notch,peak,shawl}`, `pocket_{flap,slanted,welt,patch}`, `ticket_{flap,jetted}`, `inpocket_{chest_l,chest_r,pen,lower_l,lower_r}[_mouth]`, `breast`, `button_N`, `buttonhole`, `shirt_N`.
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

This is a visualization model adapted from a CC0 MakeHuman suit, not a pattern-derived garment. It does not predict fit or drape. Measurements and unmodeled construction details are recorded as specification requests. Details requests the model can draw (lining color on the jacket's inside faces, breast pocket, ticket pocket, interior pockets, lapel buttonhole and its thread, one to three sleeve buttons, the 4×2 double-breasted) list their drawable values in `previewValues` in `src/features/customizer/tailoring.ts`; other values stay specification only. See [research-fully-customizable-3d-suit.md](research-fully-customizable-3d-suit.md) for the path to production-grade garments, and [3d-performance-report.md](3d-performance-report.md) for payload numbers.
