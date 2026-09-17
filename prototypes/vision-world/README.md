# GI Healthcare — local 3D vision prototype

**Preview: http://127.0.0.1:4173/**

A real-time, editable miniature world based on the supplied `colour copy.png`, with an architectural-materials/detail pass. The user approved this version for the production homepage on 17 September 2026. Illustrated applications are a vision, not a claim that they are already certified or in service.

## Implemented

- 21 modeled, selectable destinations across everyday life, transport, extreme environments and space.
- Smooth camera approaches, a light mist transition, draggable world, zoom/reset controls, animated water and gentle ambient movement.
- Frosted-glass information panels and searchable/filterable destination list.
- Three separately loaded 3D kitchen cutaways: school, offshore platform and space station. These include a simplified GI cooking cabinet inspired by the supplied machine photos.
- Responsive phone sheets, native keyboard controls, focus trapping, Escape/back navigation, reduced-motion support and pausing when hidden or out of view.
- Existing GI logo, Inter font, four-item navigation and supporters. Navigation to other pages uses their current live URLs; those pages are not rebuilt here.
- WebGL-unavailable and scene-error paths provide the supplied reference image with a usable destination list. No analytics, credentials, database connections, or submission endpoints.

## Isolation

The existing production source was checked at baseline `563a7f2d6307c4ac2639d259e2b2ec215c76653a`; the deployed `main.dart.js`, bootstrap and privacy script matched the local `docs` copies during the initial check. The original website, API, admin portal and collected data are untouched.

Source and native Blender assets stay in this directory on branch `codex/local-3d-vision`. Production uses a curated static export in `docs/vision/`, excluding raw material downloads and authoring files. `prototypes/` remains excluded from Vercel uploads. Next.js routes only Home to that export; Space/Careers retain their existing Flutter build, and the form/admin/API routes remain untouched. The production homepage loads the same consent-gated privacy/analytics script as the existing site.

## Production updates

From the repository root, after `npm ci --prefix prototypes/vision-world` on a new checkout:

```sh
npm run build:homepage
npm test
npm --prefix prototypes/vision-world test
npm run build
```

Commit both source changes and the generated `docs/vision/` bundle. This follows the repository's existing checked-in static-build approach and keeps remote Next.js builds independent of Blender/Vite. The normal local preview stays analytics-free; `build:homepage` explicitly selects the `live` mode, namespaced assets, same-origin navigation, indexable metadata and existing cookie controls. Stage a production deployment with `vercel deploy --prod --skip-domain`, verify it, then promote. Never change databases or credentials as part of a homepage update.

## Development

The local preview is already started for the review session. To restart later from this directory:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

```sh
npm test
npm run build
```

The build creates local output only. Template hosting metadata is retained but no publishing command is part of these scripts.

## Blender assets

Models were generated using the user's installed **Blender 5.2.2**, in background mode without opening another window or altering the running GUI scene. The old temporary 4.5.9 installer was unmounted and moved to the Mac's Trash; no old Blender installation was retained.

Editable world: `models/gi-vision-world.blend`.

To regenerate the GLB assets and native source:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/build-world.py
```

This command replaces only this prototype's generated world/interior assets and its native source file. It does not open or overwrite the user's current Blender scene.

Geometry is original procedural mesh work, grouped by destination and material for picking and draw-call control. The refined world is **10.86 MiB with 190 batches**, including embedded photographic textures; interiors are **1.23–1.53 MiB**, loaded only on demand. Blender's Meshopt compression replaces the approximately 22 MB uncompressed refinement. The current decoder is bundled locally, not fetched from a CDN. A 1.57 MiB local HDR provides reflections and daylight. This remains a heavier design prototype requiring device profiling before production.

The detail pass adds individually oriented leaf cards, bark and terrain texture, framed windows, parapets and rooftop services, tiled roofs and gutters, boat railings, shaped aircraft/rail ends, finer cabinet details, clean oak surfaces, bevelled fabricated edges and mapped Moon/Mars surfaces. Material roughness, metal response, sun direction and water have been retuned while preserving the original UI and colour family. Large dark/brown surface changes found during QA were corrected.

The native Blender world includes a presentation camera, HDR world, sun and native water plane, with Cycles and denoising configured. This setup has been saved, not launched in the user's existing Blender window. Web rendering is real-time Three.js, not a Cycles render or a claim of full photorealism.

Source maps can be fetched with `node scripts/fetch-realism-assets.mjs`. Credits and licensing are listed in [ASSET-CREDITS.md](ASSET-CREDITS.md) and the preview's Asset credits link. Reference image, logo, font and supporters were supplied by the user or copied from their existing website. A recoverable copy of the original untextured models and authoring files is in `versions/blockout-v1/` (ignored by Git).

## Review scope / next production gate

This is an architectural miniature interpretation of the reference illustration, not a pixel-identical reconstruction or finished photorealistic scene. The first pass established navigation, camera movement, readable panels and three representative interior journeys; the second refines geometry, surface response, foliage and lighting. The remaining 18 destinations currently have exterior models and information panels only.

Design approval has been received. Deployment checks cover the integrated routes, consent script, desktop/mobile rendering, model loading and a retained rollback target. Further refinement should include current Safari/iOS and lower-powered-device profiling. Browser checks use the Codex in-app browser, not a physical iPhone or comprehensive cross-browser certification. See `design-qa.md` for evidence and limitations.
