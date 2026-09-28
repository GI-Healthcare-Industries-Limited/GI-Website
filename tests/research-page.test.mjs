import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'

test('research model is self-contained glTF 2 with geometry and material assets', () => {
  const glb = readFileSync('docs/research/cooking-machine.glb')
  assert.equal(glb.toString('ascii', 0, 4), 'glTF')
  assert.equal(glb.readUInt32LE(4), 2)
  assert.equal(glb.readUInt32LE(8), glb.length)
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)))
  assert(json.meshes.length > 10)
  assert(json.materials.length > 2)
  assert(json.buffers.every(buffer => !buffer.uri))
  assert((json.images || []).every(image => !image.uri))
})

test('research has all selected sections, real local assets and honest concept labels', () => {
  const page = readFileSync('app/research/page.tsx', 'utf8')
  for (const component of ['ProductViewer', 'Principles', 'EarthSpace', 'Supporters', 'ResearchNotes', 'SiteFooter']) assert(page.includes(`<${component}`))
  for (const file of ['machine-poster.webp', 'modularity-concept.webp', 'earth-field-concept.webp', 'lunar-habitat.webp']) assert(existsSync(`assets/research/${file}`))
  assert.doesNotMatch(readFileSync('app/research/principles.tsx','utf8'), /<figcaption|Illustrative proportions|Dimensions to be confirmed|not certified performance claims/)
  assert.match(readFileSync('app/research/research-notes.tsx','utf8'), /Not peer-reviewed papers or test results/)
})

test('research motion has reduced-motion, pause, visibility and static fallback paths', () => {
  assert.match(readFileSync('app/research/use-motion.ts','utf8'), /prefers-reduced-motion/)
  const principles = readFileSync('app/research/principles.tsx','utf8')
  for (const text of ['visibilitychange', 'IntersectionObserver', 'clearInterval', 'aria-selected', 'Pause principles slideshow']) assert(principles.includes(text))
  const viewer = readFileSync('app/research/product-viewer.tsx','utf8')
  assert.match(viewer, /setFailed\(true\)/)
  assert.match(viewer, /<Image/)
  const renderer = readFileSync('app/research/render-product.ts','utf8')
  assert.doesNotMatch(renderer, /setAnimationLoop|requestAnimationFrame/)
  assert.match(renderer, /renderer.dispose\(\)/)
  assert.match(renderer, /texture.dispose\(\)/)
})

test('principles use dedicated approved-style illustrations and accessible resource details', () => {
  const source = readFileSync('app/research/principles.tsx', 'utf8')
  for (const file of ['principle-compact-v3.webp', 'principle-resources-v3.webp']) {
    assert(existsSync(`assets/research/${file}`))
    assert(source.includes(file))
  }
  assert.doesNotMatch(source, /machine-poster|styles\.dimensions|styles\.resourceIcons/)
  assert.match(source, /src: modularity/)
  for (const text of ['Resource research priorities', 'Efficient cooking and thermal management', 'Resource-conscious cooking and cleaning', 'Thoughtful portions and ingredient use']) assert(source.includes(text))
})

test('shared public footer never changes recruitment, booking or admin flows', () => {
  for (const route of ['contact','careers','privacy','research']) assert.match(readFileSync(`app/${route}/page.tsx`, 'utf8'), /<SiteFooter/)
  const footer = readFileSync('app/_components/site-footer.tsx','utf8')
  assert.match(footer, /data-gi-privacy-open/)
  assert.doesNotMatch(footer, /mailto:|tel:|<form/)
})

test('research supporters use real local artwork and include the Edinburgh office', () => {
  const source = readFileSync('app/research/supporters.tsx', 'utf8')
  const files = [...source.matchAll(/file: '([^']+)'/g)].map(match => match[1])
  assert.equal(files.length, 15)
  for (const file of files) assert(existsSync(`docs/research/supporters/${file}`), file)
  for (const file of ['intellectual-property-office.png', 'microsoft-startups-logo.png', 'nvidia-inception-logo.png', 'barclays-eagle-labs.png', 'business-gateway.svg']) assert(files.includes(file))
  assert.doesNotMatch(source, /file: ''|file: 'barclays\.svg'|file: 'microsoft-startups\.png'/)
  assert.match(source, /https:\/\/www\.bgateway\.com\/local-offices\/edinburgh\//)
  assert.match(source, /inert=\{copy === 1/)
  assert.match(source, /rel="noopener noreferrer"/)
  const gateway = readFileSync('docs/research/supporters/business-gateway.svg', 'utf8')
  assert.doesNotMatch(gateway, /<script|<foreignObject|onload=|javascript:/i)
})
