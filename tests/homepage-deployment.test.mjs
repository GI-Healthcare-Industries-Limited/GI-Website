import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

test('3D homepage owns Home while Space and Careers retain their existing app', async () => {
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync('next.config.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('module', 'exports', code)(module, module.exports)
  assert.deepEqual(await module.exports.default.rewrites(), { beforeFiles: [
    { source: '/', has: [{ type: 'query', key: 'page', value: '(?:space|careers)' }], destination: '/index.html' },
    { source: '/', destination: '/vision/index.html' },
  ] })
})

test('live bundle is namespaced, indexable, consent-aware and preserves all runtime assets', () => {
  const html = readFileSync('docs/vision/index.html', 'utf8')
  assert.match(html, /content="index,follow"/)
  assert.doesNotMatch(html, /noindex|local 3D concept/)
  assert.equal((html.match(/src="\/gi-privacy.js"/g) || []).length, 1)
  assert.match(html, /src="\/gi-home-ready.js"/)
  assert.doesNotMatch(html, /flutter_bootstrap|gi-home-navigation/)
  for (const match of html.matchAll(/(?:src|href)="(\/vision\/[^\"]+)"/g)) assert(existsSync(`docs${match[1]}`))
  for (const name of ['vision-world.glb', 'interior-school.glb', 'interior-oil-rig.glb', 'interior-station.glb', 'logo.webp', 'Inter.ttf', 'materials/daylight.hdr', 'vision-reference.png']) assert(existsSync(`docs/vision/assets/${name}`), name)
  assert.deepEqual(readdirSync('docs/vision/assets/materials'), ['daylight.hdr'])
  assert(existsSync('docs/vision/asset-credits.html'))
  const css = readdirSync('docs/vision/assets').filter(name => name.endsWith('.css')).map(name => readFileSync(`docs/vision/assets/${name}`, 'utf8')).join('')
  assert.match(css, /\/vision\/assets\/Inter.ttf/)
  const app = readdirSync('docs/vision/assets').filter(name => name.startsWith('index-') && name.endsWith('.js')).map(name => readFileSync(`docs/vision/assets/${name}`, 'utf8')).join('')
  assert.doesNotMatch(app, /Local concept preview|No visitor analytics or form submissions/)
  assert.match(app, /Privacy notice & cookie choices/)
})

function legacyPage(initial) {
  const navigations = [], listeners = {}
  const window = {
    location: { href: `https://www.gihealthcare.co.uk${initial}`, replace: (url) => navigations.push(url) },
    addEventListener: (event, callback) => { listeners[event] = callback },
    history: {},
  }
  for (const name of ['pushState', 'replaceState']) window.history[name] = function (_state, _title, url) { if (url) window.location.href = new URL(url, window.location.href).href }
  vm.runInNewContext(readFileSync('docs/gi-home-navigation.js', 'utf8'), { window, URL })
  return { window, navigations, listeners }
}

test('legacy navigation keeps secondary pages native and crosses to the new Home without duplicate history entries', () => {
  const page = legacyPage('/?page=space')
  assert.deepEqual(page.navigations, [])
  page.window.history.pushState(null, '', '/?page=careers')
  assert.deepEqual(page.navigations, [])
  page.window.history.pushState(null, '', '/?page=home')
  assert.deepEqual(page.navigations, ['/'])
  for (const route of ['/', '/?page=home', '/index.html']) assert.deepEqual(legacyPage(route).navigations, ['/'])
  const back = legacyPage('/?page=careers')
  back.window.location.href = 'https://www.gihealthcare.co.uk/'
  back.listeners.popstate()
  assert.deepEqual(back.navigations, ['/'])
  assert.equal(readFileSync('docs/gi-home-navigation.js', 'utf8'), readFileSync('frontend/web/gi-home-navigation.js', 'utf8'))
})
