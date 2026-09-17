# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## GI-specific boundaries and preferences

- Local-only until the user explicitly approves deployment. Do not push, publish, change DNS, or touch production data.
- The existing source checkout was verified against the live deployment before this prototype began. Do not overwrite it with a fresh scaffold.
- Reference: `/Users/gihealthcareindustrieslimited/Downloads/colour copy.png`. Build a real miniature 3D world, not a flat image with parallax.
- GI develops autonomous cooking machines, not medical devices. Use the updated orbital GI logo and existing Inter typeface.
- Preserve the four-item navigation and supporters. The homepage is the interactive world plus supporters.
- There are 21 destinations. The first iteration includes cutaway cooking spaces for schools, offshore platforms, and space stations.
- Use the user's installed `/Applications/Blender.app` (5.2.2 at build time). Do not download another Blender or open extra GUI windows. Background export must not touch the user's open scene.
- Generated geometry source is `scripts/build-world.py`; editable native world is `models/gi-vision-world.blend`.
- 17 September feedback: preserve the current palette and interface, but replace the toy-like elementary geometry with a more realistic architectural-visualisation treatment: fine foliage, textured materials, detailed facades, natural lighting and credible machinery.
- 17 September: the user approved deploying this version to the existing GI Healthcare site. Build production assets with `npm run build:homepage` at the repository root; this publishes a namespaced static bundle into `docs/vision/`. Normal prototype development remains local, with analytics disabled. Keep the existing Next.js APIs, data, privacy controls and secondary pages unchanged.
