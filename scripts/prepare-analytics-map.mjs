// Reproducible local asset, not a third-party map request from visitors' browsers.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'
import { geoCentroid } from 'd3-geo'
import countries from 'i18n-iso-countries'
const require = createRequire(import.meta.url)
const topology = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))
const world = feature(topology, topology.objects.countries)
const centres = {}
world.features = world.features.filter(f => f.properties.name !== 'Antarctica').map(f => {
  const code = countries.numericToAlpha2(f.id) || (f.properties.name === 'Kosovo' ? 'XK' : null)
  if (code) centres[code] = geoCentroid(f).map(n => Math.round(n * 100) / 100)
  return { ...f, properties: { name: code || f.properties.name } }
})
for (const directory of ['docs/analytics', 'frontend/web/analytics']) {
  mkdirSync(directory, { recursive: true })
  writeFileSync(`${directory}/world.json`, JSON.stringify({ world, centres }) + '\n')
}
console.log(`Prepared local Natural Earth map with ${world.features.length} regions.`)
