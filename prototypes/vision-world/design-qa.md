# Design QA — GI 3D vision

## Realism refinement — 17 September 2026

**final result: passed — local refinement review, not production clearance or user design approval.**

User-directed scope: retain the approved palette and glass interface; reduce the elementary/toy-like appearance using Blender detail, materials and lighting. The source illustration, original browser capture (`qa/desktop-world.png`) and refined capture (`qa/realism-world.png`) were inspected together. This remains an interactive architectural miniature, not a photorealistic reconstruction of every setting.

### Material findings resolved

- Replaced faceted cone/sphere vegetation with branched trees and photographed alpha-masked leaves. The first foliage pass was too dark and visually noisy; adjusted leaf UVs, canopy distribution and thin-leaf fill. Moved interior trees clear of the walls.
- Replaced the smooth layered island plinth with textured geological sides; added photographic grass/bark/normal maps. Corrected brown wall albedo and yellowed ground to retain the approved ivory/green family.
- Added roof tiles/gutters, finer facade framing, roof parapets/services, door canopies, slatted benches, rail/aircraft shaping, boat rails and cooking-cabinet details. Removed flat-roof HVAC pieces intersecting pitched roofs.
- Replaced the overly rustic kitchen wood with clean oak. Added window surrounds and foliage to the interior plant.
- Added local photographic HDR reflections, more directional daylight, material-specific roughness/metal response and fabricated-edge bevels. Replaced dotted water with physical shading/ripples and enlarged its plane to eliminate the visible distant edge.
- Added mapped Moon/Mars surfaces and corrected spherical UV seams. Replaced the simple Antarctic cone with an irregular mountain surface.
- Kept existing typography, glass panels, responsive layout, four-link navigation, supporters and all 21 destination IDs.

### Verification

- Desktop: overview, school exterior/interior, offshore navigation/interior, space-station exterior/interior, return/reset flow. Actual 3D rendered without a fallback/error screen.
- Phone-sized viewport, 390×844: overview and offshore kitchen; readable lower sheet, working back navigation, document width equals viewport width. Viewport override reset afterwards. This is browser emulation, not physical-device certification.
- Browser error log empty during the refinement checks. Existing upstream `THREE.Clock` warning is non-blocking.
- `npm test`: **13/13 pass**, now decoding compressed buffers before validating finite positions and triangle indices. Tests also cover destination membership, UV presence, embedded material maps, file-size ceilings and retained build packaging.
- `npm run build`: passes. The lazy 3D chunk remains about 1.13 MB minified / 309 KB gzip; Vite's advisory remains visible.
- Measured refined world: **10.86 MiB, 190 batches**. Interiors: **1.23–1.53 MiB** on demand. Meshopt decoder and HDR are local. Mobile shadow resolution is lower than desktop. No claim of measured low-power-device frame rate.
- React performance review: no new per-frame React state updates; camera/ocean movement remains in frame callbacks, heavy assets stay memoised/lazy, pause and reduced-motion wiring remains intact. No dependency/version changes required.
- Blender 5.2.2 background export completed, with a packed, render-ready native world (camera, sun, HDR, water, Cycles settings). No additional GUI window or change to the user's open Blender scene. Native Cycles rendering was configured, not rendered as verification evidence.
- Asset attribution is documented and linked in the local preview. Original blockout backed up under `versions/blockout-v1/`.
- Production tracked diff still contains only the pre-existing `prototypes/` exclusion in `.vercelignore`. No live asset, form, database, admin, DNS or deployment changes.

New captures: `qa/realism-world.png`, `qa/realism-school.png`, `qa/realism-school-interior.png`, `qa/realism-mobile-world.png`, `qa/realism-mobile-offshore.png`, `qa/realism-station-interior.png`.

Remaining production gates: user art-direction review; physical Safari/iOS and lower-powered GPU profiling; delivery optimisation; full accessibility and runtime-context-loss checks. Eighteen destinations still have exterior models and information panels only. These limitations are unchanged and do not block review of the requested local realism pass.

---

## Original first-pass review (retained as history)

Date: 17 September 2026. Review target: `http://127.0.0.1:4173/`.

## Source and method

The authoritative visual direction is the user's `colour copy.png`: an isometric island, soft blue water/sky, green vegetation, transport and industry, with orbit/Moon/Mars above. This is a **real 3D interpretation**, not a pixel-identical image clone. Existing GI logo, Inter font and supporters come from the current website.

Used the Product Design image-to-code/QA workflow to compare the source and the actual browser capture in the same inspection pass. Native Blender meshes replace the reference illustration, not CSS/SVG artwork. Phosphor supplies the UI icons. No generated raster substitute is presented as 3D.

Browser: Codex in-app browser. Desktop 1082×912, phone 390×844, tablet 820×1180. Captures are in `qa/` (ignored by Git).

## Findings and fixes

| Surface | Finding | Resolution |
|---|---|---|
| Model geometry | Industrial cooling towers failed to export correctly because a ring-index loop was missing. | Fixed vertices, added authoring-time validation and tests for every GLB triangle index. Towers visibly present. |
| Materials | Workplace towers appeared solid white rather than the reference's glazed grid. | Added exterior glazing panes; confirmed blue/glass facades in browser. |
| Interaction | Changing scene could shift document scroll and hide the back control beneath the header. | Prevented focus scrolling, reset scene navigation to page top, and reset the detail sheet's own scroll for new content. |
| Phone composition | Kitchen model was too close and cropped. | Wider phone camera and top-half framing; lower native HTML sheet remains readable. |
| Tablet composition | Landscape camera cropped edges on tall screens. | Aspect-aware overview fitting. |
| Typography | Secondary content and touch controls were too small. | Increased body copy to 13px, secondary copy to 10px, stronger secondary contrast, and primary icon-control targets to at least 44px. |
| Accessibility | Mobile first-category label disappeared with its visual text; dialog background remained reachable. | Explicit category accessible names, inert page background, modal keyboard trap, Escape and focus restoration. |
| Performance | Ambient scene continued when not useful. | Demand-driven renderer, hidden/out-of-view/dialog pausing, manual pause, reduced-motion handling, lazy 3D import and separately loaded interiors. |
| Runtime | Removed Three.js soft-shadow constant emitted repeated warnings. | Explicit current PCF shadow mode; no browser errors in final check. |

## Visual assessment

- **Layout/spacing:** single world-first viewport, preserved four-link header, glass navigation dock and right-side detail panel. Phone uses a bottom sheet; long content scrolls within that sheet. No document horizontal overflow observed on tested phone/tablet sizes.
- **Typography:** local Inter, restrained heading hierarchy, shorter panel copy, clear separation of category/title/body/tags/actions. Further art-direction changes can be made after user review.
- **Colour/materials:** pale blue environment, soft green/cream land, teal glass, coral accents and the existing red GI header. Interior station uses a dark blue backdrop. Frosted panels have readable opaque-enough surfaces; reduced-transparency CSS is provided.
- **Asset fidelity:** all 21 settings have real selectable geometry. Isometric composition and subject coverage match the source's intent; terrain, architecture, water and planets intentionally have less detail in this first performance-conscious model. Cooking cabinet is a simplified interpretation of the user's machine, not production CAD.
- **Icons:** one Phosphor family throughout, aligned native buttons and labels; no custom decorative SVG artwork.
- **Content:** copy identifies these as a vision and potential applications, with validation/certification caveats where relevant; does not imply deployed, certified flight/medical hardware.

## Checks completed

- Local server loads the actual GLB world without a blank page or framework error overlay.
- Desktop school exterior and interior; phone school and offshore interiors; desktop station interior.
- Next-destination navigation traversed the catalogue, including wrap from Mars back to Schools; modal search and category data cover all 21 entries.
- Search result and no-result states, modal Shift+Tab wrap, Escape returning to overview, close/reset controls, pause/resume state.
- Phone/tablet dimensions inspected and viewport reset afterwards. Header/logo and supporters remain present.
- Runtime error log empty in final browser check. An upstream `THREE.Clock` deprecation warning from the current rendering dependency remains non-blocking.
- `npm test`: 12/12 pass, including unique catalogue/category coverage, all destination geometry groups, finite vertices, valid triangle indices, bounded asset sizes, editable Blender file and retained build-packaging tests.
- `npm run build`: succeeds. Three.js lazy chunk is approximately 1.04 MB minified / 282 KB gzip; Vite's size advisory remains. No attempt to hide that warning.
- Production source diff contains only the `prototypes/` exclusion in `.vercelignore`. No database, credential, form, admin or production asset modifications.

## Captures

- `qa/desktop-world.png`
- `qa/desktop-school.png`
- `qa/desktop-school-interior.png`
- `qa/desktop-station-interior.png`
- `qa/mobile-world.png`
- `qa/mobile-school-interior.png`
- `qa/mobile-offshore-interior.png`
- `qa/tablet-world.png`

## Status and limitations

**Ready for local design review, not cleared for production rollout.** Three featured destinations have kitchen cutaways; 18 currently have exterior models and information panels. Mist/camera transitions establish the interaction, but are not yet a bespoke cinematic route for every setting.

Physical iPhone/Safari, low-power GPU/frame-rate/memory profiling, runtime WebGL-loss injection, screen-reader testing, and comprehensive text-zoom/reduced-motion emulation remain production checks. The no-WebGL fallback and reduced-motion paths were reviewed in code, not tested by changing the user's system settings. No claim of comprehensive accessibility certification or final photorealistic fidelity is made.

The original site and collected data were not changed. Nothing was deployed.
