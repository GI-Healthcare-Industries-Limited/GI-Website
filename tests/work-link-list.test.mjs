import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function load(path) {
  const module = { exports: {} }
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@/lib/application-questions') return load('lib/application-questions.ts')
    if (name === '@phosphor-icons/react') return { ArrowSquareOutIcon: () => null, LinkSimpleIcon: () => null }
    return require(name)
  }, module, module.exports)
  return module.exports
}

test('admin renders safe work links without previews and never creates unsafe anchors', () => {
  const { WorkLinkList } = load('app/admin/work-link-list.tsx')
  const { renderToStaticMarkup } = require('react-dom/server')
  const html = renderToStaticMarkup(WorkLinkList({ links: ['https://example.invalid/board', 'javascript:alert(1)', 'https://name:password@example.invalid'] }))
  assert.match(html, /href="https:\/\/example.invalid\/board"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.doesNotMatch(html, /javascript:|password|<iframe|<img/)
  assert.equal(WorkLinkList({ links: [] }), null)
  const { isSafeWorkLink } = load('lib/application-questions.ts')
  for (const value of ['https:example.invalid', 'https://example.invalid/a b', 'https://exam\nple.invalid']) assert.equal(isSafeWorkLink(value), false)
})
