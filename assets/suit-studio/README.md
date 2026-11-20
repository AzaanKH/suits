# Arden suit studio assets

The studio replaces the previous procedural mannequin and suit blocks.

## Source and license

Base garment meshes and garment normal maps are adapted from **Men’s Suit 3**, **Men’s Double-breasted Suit**, and **Dinner Jacket** by **Margaret Toigo / MargaretToigo / MRT**, published by the MakeHuman Community under **CC0**.

- Catalog and license: https://static.makehumancommunity.org/assets/assetpacks/suits01.html
- Pack: https://files2.makehumancommunity.org/asset_packs/suits01/suits01_cc0.zip
- Original Suit 3: http://www.makehumancommunity.org/node/1733
- Original double-breasted suit: http://www.makehumancommunity.org/node/1740
- Original dinner jacket: http://www.makehumancommunity.org/node/1746
- CC0: https://creativecommons.org/publicdomain/zero/1.0/
- Retrieved October 4, 2026. Source OBJ headers also contain the CC0 declaration. The original pack metadata is retained in source/pack-provenance.json.

Changes: relaxed sleeve pose, revised waist and leg proportions, open quarters, subdivision, named separate garment regions, material replacement, lapel and pocket variants, additional buttons, optional waistcoat and trouser details. These are visualization assets, not cutting patterns or validated fit simulation.

The original OBJ files and normal maps are retained to reproduce the conversion. `scripts/build-suit-studio.py` builds the editable `arden-studio.blend` and exports the raw `assets/suit-studio/arden-tailoring.glb` and `parts.json` inventory. The old schematic model is not used by this viewer.

## Cloth and design concept

The neutral wool texture and studio screen concept were created with the built-in image generator. The screen concept is saved at `docs/design/suit-studio-concept.png`. The real interface is HTML and React; the displayed suit is a modular GLB.

Texture prompt: A seamless neutral light-gray worsted wool hopsack albedo, flat orthographic macro view, fine interwoven yarns and fuzzy fibers, even diffuse lighting, no folds, borders or text. Multiply with the chosen cloth color in the renderer.

The woven color texture is used with the original garment normal maps. It is an illustrative cloth texture, not a certified scan of a named mill's fabric.

## Rebuild

1. Run `pnpm assets:studio:build` (Blender in background mode) from the repository root. This produces the editable Blender file, raw GLB, part inventory, and an offline review render.
2. Run `pnpm assets:studio:textures` to produce the WebP textures from retained source PNGs.
3. Run `pnpm assets:studio:split` to write the Meshopt GLBs the viewer loads: `suit-core.glb` (shared meshes and the single-breasted block), `suit-double.glb`, and `suit-dinner.glb`. Named meshes remain separate so garment swaps continue to work.

The browser first loads `suit-core.glb` with the wool and single-breasted textures (about 2.6 MB), then the other two blocks on demand or in the background. It does not fetch the raw GLB or source PNG files. Lighting is generated locally; no external HDR download is required.

The three jacket blocks have their own collars, shirt inserts, cuffs and normal maps. Shawl lapels select the dinner-jacket block. Measurements and unmodeled construction details remain specification requests; lining color is drawn on the jacket body's inside faces. The waistcoat is a simplified visual insert; this model does not predict fit, drape, or manufacturing feasibility.
