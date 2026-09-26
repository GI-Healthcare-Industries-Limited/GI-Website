# Research imagery

Visual target: approved original product-led option 2, revised with a small machine on the lunar-habitat worktop.

- `research-hero.webp`: built-in image generation, 1600 × 900. Prompt: preserve the approved stainless-steel machine, warm studio light and right-side placement, with empty left space; remove typography, navigation and annotations. Based on the approved mockup and supplied machine photograph.
- `lunar-habitat.webp`: lossless 556 × 406 extraction from the approved revision, preserving the exact scene and countertop machine. Original generated mockup: `exec-6fa909b4-682d-43c3-8caf-80ab6f0e501c.png`.

Both images are labelled conceptual on the page, not photographs of deployed space hardware.

## September 2026 interactive redesign

- `cooking-machine.blend`: original visual reconstruction made with the installed Blender 5.2.2. Bevelled enclosure, black L-shaped front, touchscreen, handle, feet and illustrative rear service details. Normalized proportions only: not engineering CAD, a validated product specification, or evidence of internal construction.
- `machine-poster.png` / `.webp`: matching transparent Blender studio render used for immediate display, WebGL fallback and the first two principles. Exported with alpha; no invented dimensions.
- `modularity-concept.png` / `.webp`: generated illustrative product visual, showing a service hatch and removable component. This is an illustration of the research principle, not actual internal engineering.
- `earth-field-concept.png` / `.webp`: generated remote field-camp concept, not a photograph of a GI deployment.
- The approved `lunar-habitat.webp` remains unchanged.

Rebuild the native model, web GLB and PNG poster without changing the open Blender GUI scene:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build-research-machine.py
node -e "require('sharp')('assets/research/machine-poster.png').webp({quality:88}).toFile('assets/research/machine-poster.webp')"
npm run prepare-public
```

The web model is `docs/research/cooking-machine.glb`. The viewer uses the existing local daylight environment credited in `docs/vision/asset-credits.html` and renders only on demand. The three research notebook entries are original editorial perspectives, explicitly not published scientific papers or experimental findings.
