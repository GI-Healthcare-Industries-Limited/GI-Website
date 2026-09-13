import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('Vercel Functions are explicitly pinned to London', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.regions, ['lhr1'])

  // Overrides must not silently place part of the backend outside London.
  for (const settings of [config, ...Object.values(config.functions || {})]) {
    if (settings.regions) assert.deepEqual(settings.regions, ['lhr1'])
    assert.ok((settings.functionFailoverRegions || []).every(region => region === 'lhr1'))
  }
})
