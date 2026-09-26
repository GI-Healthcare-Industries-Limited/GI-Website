# Research redesign — 26 September 2026

final result: passed

## Source truth and rendered evidence

Source directory: `/Users/gihealthcareindustrieslimited/.codex/generated_images/019fb87f-090d-79b1-94ba-81092418c106/`.

- Full-page direction: `exec-e79f1d0b-0d36-4eea-b188-070a0e615bd1.png` (890 × 1767).
- Latest section-two modularity state: `exec-1ef3a6e3-b3d8-4487-8907-ac86cecd3731.png` (1681 × 936). The user's later slideshow instruction supersedes the exploded model in the original full-page concept.
- Selected red footer: `exec-f8fbc2b8-46ea-451e-bad2-1e2b3c9c0410.png` (813 × 1933, footer cropped for comparison).
- Rendered route: `http://localhost:4174/research`. Desktop 1440 × 900, tablet 768 × 1024, mobile 390 × 844, CSS pixels and screenshots at 1:1 density.
- Full-page screenshot: `.design-qa-research-full.png` captured in a 1440 × 3600 viewport at scrollY=0, to avoid the browser provider's stitched-full-page duplication defect. This is a normal viewport screenshot, not a stitched capture. Responsive width remains desktop.
- Full comparison: `.design-qa-research-comparison.png`, source and implementation together, both normalized to 650 pixels wide without distorting aspect ratios.
- Focused comparison: `.design-qa-research-slide-comparison.png`, latest slide reference next to implementation crop; `.design-qa-research-footer-comparison.png`, selected red footer and actual footer at equal 720-pixel widths.
- Additional screenshots: `.design-qa-research-hero.png`, `.design-qa-research-rotation.png`, `.design-qa-research-principle1.png`, `.design-qa-research-principle2.png`, `.design-qa-research-principle3.png`, `.design-qa-research-earth.png`, `.design-qa-research-supporters.png`, `.design-qa-research-notes.png`, `.design-qa-research-mobile.png`, `.design-qa-research-mobile-principles.png`, `.design-qa-research-mobile-footer.png`, `.design-qa-research-tablet.png`.
- Shared footer: `.design-qa-contact-footer.png`, `.design-qa-home-footer.png`.

## Findings and comparison history

1. P2, initial 3D front: overlapping black surfaces produced a reflection seam. Replaced with one L-shaped mesh, re-exported from Blender, added restrained brushed-metal normal detail and local HDR lighting fallback. Post-fix hero and rotation screenshots show a continuous front and working side rotation.
2. P2, initial poster: opaque background conflicted with the pale principle section. Re-rendered with transparent film and RGBA output, retaining a natural shadow catcher. Final full-page capture shows the integrated product. Dimension lines are illustrative and contain no invented measurements.
3. P2, supporter contrast: white Accelerator and Glasgow marks disappeared on white. Preserved original artwork and used a dark tile, as for Nexus. Final full-page capture includes the corrected Accelerator tile; the same class applies to Glasgow and Nexus. A contact sheet checked all 12 logo assets.
4. P2, range alignment: the Earth/space control initially used the full image width despite a 25–75 range. Inset the interactive range to those boundaries. Keyboard changes update the accessible percentage.
5. Non-visual fixes: replaced deprecated RGBELoader with HDRLoader; fixed eager-loading hint for the shared poster; dispose model textures; support horizontal and vertical arrow keys for tabs. No application errors observed. Earlier development warnings are historical.

## Required fidelity surfaces

- **Typography:** existing local Inter-based site typography, restrained 450-weight headings, compact uppercase labels and readable paragraph line height. Desktop heading is two lines; tablet/mobile wrap naturally without clipping. Controls judged at real viewport size, not downscaled contact-sheet size.
- **Spacing/layout:** selected split hero, numbered rail/product/copy section, paired frontiers, supporter strip, dark three-column notebook and red public footer retained. Clear space separates supporters and notebook. Mobile has horizontal principle navigation and stacked imagery/articles/footer. No horizontal page overflow at 390px; no broken images.
- **Colour:** established site red, warm white/pale grey, charcoal notebook and muted text. Existing shared header and actual logo retained. Browser capture colour profile differs from generated mock; CSS tokens remain the site's palette.
- **Imagery:** user-requested Blender recreation and optimized embedded GLB, not CSS geometry or a pretend rotating photo. Generated modularity/field assets follow the chosen direction. Exact approved habitat preserved. Original supporter artwork retained; IPO and NVIDIA use plain names pending approved badges, not fabricated logos.
- **Copy:** principles preserve intent without fabricated measurements or efficiency claims. Notebook contains real short original perspectives, explicitly not peer-reviewed papers/test results. No fake authors, dates, citations or publication links.

## Intentional adaptations

- Hero callouts and exploded controls removed as requested; horizontal 360° drag plus keyboard/button alternatives only.
- Earth/space explanatory copy sits above imagery for readable/mobile adaptation. Selected visual story and comparison remain.
- Notebook uses existing/generated assets and editorial content instead of illustrative paper thumbnails: actual publications were not supplied.
- Earlier selected red footer replaces the leaf footer in the full-page mock. Shared across Home, Research, Careers, role detail, Contact and Privacy, not admin/application/booking.
- Blender model and modularity image are labelled concepts, not validated engineering CAD.

## Interaction and regression checks

- Real browser: 360° drag changes orientation; reset restores it; keyboard handlers inspected; tab-navigation tested.
- All three principles, arrow-key changes, selected semantics, automatic progression observed, manual selection pauses, play/pause available. Visibility/reduced-motion guards inspected and regression checked; no OS motion settings changed.
- Earth/space keyboard change 50 → 51 and mobile stacked layout.
- Supporter Next scrolls and pauses. Hover/focus/wheel/touch pause handlers checked. No physical trackpad test available.
- Notebook expands real article text.
- Footer cookie link opens existing preferences; Reject closes it. Contact form and homepage footer render correctly. No forms submitted.
- Root production build and typecheck pass; 158 root tests and 13 homepage tests pass. GLB version/container/embedded assets validated.
- No database migration, secret change, admin edit, recruitment-flow change or deletion of collected data.

## Residual gaps / P3 follow-up

- Exact dimensions and approved IPO/NVIDIA artwork can replace labels/plain names when supplied.
- Physical iOS/Safari GPU testing not available; static poster and reduced-motion paths remain. Desktop/tablet/mobile responsive layout and WebGL verified locally.
- No remaining actionable P0/P1/P2 findings in the selected scope.

## Checklist

- [x] Selected page sections and red public footer implemented.
- [x] Blender source, web model, poster and provenance retained.
- [x] Responsive and primary interaction checks complete.
- [x] Build/test gates passed, no live data mutations.
- [ ] Confirm production deployment and live assets after merge.
