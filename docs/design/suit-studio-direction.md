# Suit studio redesign

Design reference: suit-studio-concept.png, generated with the built-in image tool. The image is an art direction reference, never a substitute for the interactive model.

- Canvas: cool pale gray #eef0f1. Controls: white #ffffff. Ink: #182638. Secondary text: #68717a. Rules: #d9dde1.
- Type: existing Cormorant for the brand and headings; existing Manrope for controls and product information.
- Composition: full-height garment stage on the left, white configuration rail on the right. On small screens, stage above the rail with easy access to camera presets.
- Native controls: Front, Side, Back, Detail; drag to rotate; fabric and garment selections; Continue; Save design. No decorative labels.
- Preserve the real catalog, prices, all ten customization stages, fit and save flows. Concept's sample prices and fabric names are illustrative and will be replaced with actual catalog values.
- Keep the site's navigation destinations and account/cart access. Simplify their presentation inside the studio.
- Main visual: actual modular GLB garment; no head, hands, platform, or old schematic shapes. Seams, lapels, pockets, buttons and cloth should hold up under camera rotation.

Verification will compare studio composition, palette, typography, swatch treatment, camera framing, mobile layout and interactions. Record any remaining asset-quality limitations honestly.

## Visual comparison — October 4, 2026

Compared `suit-studio-concept.png` with the running application captured in `suit-studio-desktop.png` at 1536 × 1024 and `suit-studio-mobile.png` at 390 × 844.

| Area                 | Result                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition          | White header, pale gray garment stage and white control rail match the reference direction. Stage occupies 61% instead of the concept’s roughly 65%, allowing all ten real customization stages to fit.                                        |
| Typography and color | Large serif heading, restrained sans-serif controls, navy primary action and cool gray background are implemented.                                                                                                                             |
| Catalog              | Two actual fabric choices, current $1,195 base price, ten stages and account/cart access replace the concept’s illustrative four swatches, $895 price and three stages.                                                                        |
| Garment              | New authored CC0 garments replace the previous procedural blocks. Separate single-breasted, double-breasted and dinner-jacket assemblies retain sleeves, collars, pockets, shirts and buttons.                                                 |
| Fidelity limitation  | The interactive model is smoother, more fitted and less naturally draped than the concept. It is not yet a photographic match. Mill-specific scans, pattern-based cloth simulation and finer garment sculpting remain needed for that target.  |
| Mobile               | Stacked preview and controls, four camera presets, no horizontal overflow at 390 px. Desktop also has no horizontal overflow at 1536 px.                                                                                                       |
| Functional checks    | Fabric swaps, contrasting trouser cloth, optional waistcoat and contrasting waistcoat cloth, jacket/lapel variants, Front/Side/Back/Detail cameras, keyboard preview tabs, reset, review and sign-in handoff exercised in the running browser. |
| Verification limits  | Export button was exercised, but the browser’s download-event capture timed out; the downloaded file was not independently inspected. No authenticated save or purchase was performed.                                                         |

The waistcoat insert was corrected after visual inspection found it overlapping the jacket. Lining color is now explicitly specification-only because this closed garment model does not display an interior lining. Construction and measurement requests remain recorded without claiming fit simulation or maker approval.

Validation: 72 tests across 16 files pass; TypeScript, ESLint and production build pass. Browser console showed no errors in the final interaction check. The viewer loads a roughly 2.65 MB Meshopt garment and four WebP maps, with no external lighting asset request.
