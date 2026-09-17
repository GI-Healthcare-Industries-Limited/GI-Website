// Reproducible static export, analogous to the existing Flutter docs bundle.
// Run npm ci in prototypes/vision-world once before building on a new checkout.
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const prototype = path.join(root, 'prototypes/vision-world')
execFileSync(process.execPath, [path.join(prototype, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'live'], {
  cwd: prototype, stdio: 'inherit',
})
const source = path.join(prototype, 'dist/client')
const output = path.join(root, 'docs/vision')
// Only this generated, namespaced bundle is replaced. No forms or data touched.
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
for (const entry of await readdir(source)) {
  await cp(path.join(source, entry), path.join(output, entry), {
    recursive: true,
    filter: (file) => {
      const relative = path.relative(source, file).split(path.sep).join('/')
      return !relative.startsWith('assets/materials/') || relative === 'assets/materials/daylight.hdr'
    },
  })
}
console.log('Approved homepage exported to docs/vision; run the root build before deploying.')
