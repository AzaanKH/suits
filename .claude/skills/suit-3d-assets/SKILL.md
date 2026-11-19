---
name: suit-3d-assets
description: Rebuild, change, or add to the 3D suit studio model (Blender source, GLB export, textures, Meshopt compression) and keep the runtime contract intact. Use when editing assets/suit-studio, scripts/build-suit-studio.py, public/models/suit-studio, mesh names, or material slots, or when a garment part shows wrong, disappears, or cannot be clicked in /customize or /studio.
---

# Suit 3D assets

The studio renders one GLB that holds every option variant. Code shows and hides meshes by name. Breaking a name silently breaks a customer-facing option, so treat mesh names as an API.

Read `docs/3d-suit-configurator.md` first. It is the contract.

## Pipeline

All commands run from the repository root. Blender must be on `PATH`.

```bash
pnpm assets:studio:build      # Blender: arden-studio.blend, assets/suit-studio/arden-tailoring.glb, parts.json, model-review.png
pnpm assets:studio:textures   # only if source PNGs changed
pnpm assets:studio:compress   # Meshopt -> public/models/suit-studio/arden-tailoring-optimized.glb
```

Only `public/models/suit-studio/` is deployed. Never write raw or source files there.

After a rebuild:

1. Bump the `?v=` query on `SUIT_MODEL_URL` in `src/features/customizer/three-d/suit-model.tsx`.
2. Diff `assets/suit-studio/parts.json` against git. A renamed or missing mesh is a breaking change.
3. Look at `assets/suit-studio/model-review.png`. It is an offline Cycles render of the default suit.
4. Update the numbers in `docs/3d-performance-report.md` if bytes or triangles changed noticeably.

## Naming contract

`<block>_<part>[_<variant>]`, where block is `single`, `double`, or `dinner`. Shared meshes have no block prefix: `trousers`, `pleat_*`, `waist_loop_*`, `waist_adjuster_*`, `waistcoat`, `vest_button_*`, `shirt_button_*`.

A new mesh needs three things, or it will render but behave wrongly:

1. **Visibility:** a rule in the `model.traverse` block of `TailoredSuit` in `suit-model.tsx`, unless it should always show with its block.
2. **Click target:** a case in `getSuitPartForMesh` in `suit-parts.ts`, plus a row in `suit-parts.test.ts`. Return `null` for parts the customer cannot change.
3. **Material:** a Blender material named after an existing slot (`Cloth`, `Lapel`, `Trouser`, `Waistcoat`, `Shirt`, `Button`, `Lining`). Unknown slots fall back to `Cloth`.

A new option code also needs adding to `SUPPORTED_CODES` in `suit-selection.ts`, or the scene falls back to the default.

## Budgets

The current load is about 6.6 MB and 514k triangles, of which roughly 190k–270k are visible. Check `parts.json` before adding detail. A new jacket block adds 100k–190k triangles to every visitor's download. Prefer variants of existing parts over new blocks.

## Git LFS

`*.glb`, `*.blend`, `*.obj`, `assets/**/*.png`, `assets/**/*.thumb`, and `public/models/**/*.webp` are LFS-tracked. Run `git lfs ls-files` to confirm a new binary went to LFS before committing. Do not commit `*.blend1` autosaves; they are ignored.

## Verify in a browser

Unit tests cannot see geometry. After any asset change:

1. `pnpm build && pnpm start`.
2. Open `/studio/house-navy-hopsack-suit`. Step through every jacket style, lapel, and pocket, and confirm each part appears and nothing from another block shows through.
3. Hover each part and confirm the outline and the "Change …" tooltip name the right step.
4. Run `pnpm exec playwright test tests/e2e/studio.spec.ts tests/e2e/customizer-3d.spec.ts`.
