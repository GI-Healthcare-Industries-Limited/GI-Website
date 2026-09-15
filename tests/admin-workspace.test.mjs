import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const compile = file => ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText
const icons = new Proxy({}, { get: () => () => null })
const css = new Proxy({}, { get: (_, key) => String(key) })

function fixture() {
  const session = { access_token: 'synthetic-token', user: { id: 'synthetic-admin' } }
  const items = ['Alex Morgan', 'Sam Taylor'].map((name, index) => ({
    id: `synthetic-${index}`, name, email: `person${index}@example.invalid`, phone: null, status: 'new',
    created_at: new Date().toISOString(), retention_expires_at: new Date(Date.now() + 86400000).toISOString(),
    message: `Synthetic enquiry ${index}`, privacy_notice_version: 'test-only',
  }))
  const slots = [session, false, 'contact', false, items]
  let cursor = 0
  let tree
  const calls = []
  const browser = { confirm: () => false }
  const hooks = {
    ...React, useEffect() {}, useCallback: fn => fn, useMemo: fn => fn(),
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
  }
  const modules = {}
  function localRequire(name) {
    if (name === 'react') return hooks
    if (name === '@phosphor-icons/react') return icons
    if (name.endsWith('.css')) return css
    if (name.startsWith('@/assets/')) return { src: '/synthetic-logo.png' }
    if (name.startsWith('next/')) return () => null
    if (name === '@/lib/supabase/browser') return { getSupabaseBrowserClient: () => ({ auth: {} }), clearStoredAdminSession() {} }
    if (name.startsWith('@/app/admin/')) return new Proxy({}, { get: (_, key) => modules[key] ??= function Child() { return null } })
    if (name.startsWith('@/lib/')) {
      const module = { exports: {} }
      new Function('require', 'module', 'exports', compile(`${name.slice(2)}.ts`))(localRequire, module, module.exports)
      return module.exports
    }
    return require(name)
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'window', 'fetch', compile('app/admin/admin-dashboard.tsx'))(localRequire, module, module.exports, browser,
    async (url, init) => { calls.push({ url, ...init }); return { ok: true, status: 200, json: async () => ({ ok: true, success: true }) } })
  const nodes = (node = tree) => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children ?? null)]
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : ''
  const find = predicate => nodes().find(predicate)
  const render = () => { cursor = 0; tree = module.exports.AdminDashboard(); return tree }
  render()
  return { calls, slots, browser, nodes, find, render, text, async click(label) { await find(node => node.type === 'button' && text(node).trim() === label).props.onClick(); await new Promise(setImmediate); render() } }
}

test('job postings have their own view without clearing the selected inbox or making writes', async () => {
  const f = fixture()
  const selected = f.find(n => n.type === 'button' && n.props['aria-pressed'])
  await f.click('Job postings')
  assert.equal(f.text(f.find(n => n.type === 'h1')), 'Job postings')
  assert.equal(f.find(n => n.type === 'button' && n.props['aria-pressed']).key, selected.key)
  await f.click('Messages')
  assert.equal(f.text(f.find(n => n.type === 'h1')), 'Messages')
  assert.equal(f.calls.length, 0)
  assert.equal(f.slots[4].length, 2)
})

test('search is read-only and survives returning from job postings to the same inbox', async () => {
  const f = fixture()
  f.find(n => n.type === 'input' && n.props.type === 'search').props.onChange({ target: { value: 'Sam' } })
  f.render()
  assert.equal(f.text(f.find(n => n.type === 'h2' && f.text(n) === 'Sam Taylor')), 'Sam Taylor')
  assert.equal(f.nodes().filter(n => n.type === 'button' && typeof n.props['aria-pressed'] === 'boolean').length, 1)
  assert.equal(f.slots[4].length, 2)
  assert.equal(f.calls.length, 0)
  await f.click('Job postings')
  await f.click('Messages')
  assert.equal(f.slots[4].length, 2)
  assert.equal(f.find(n => n.type === 'input' && n.props.type === 'search').props.value, 'Sam')
})

test('status control preserves the authenticated, single-record update contract', async () => {
  const f = fixture()
  const control = f.find(n => n.type === 'select' && n.props.value === 'new')
  control.props.onChange({ target: { value: 'resolved' } })
  await Promise.resolve()
  assert.equal(f.calls.length, 1)
  assert.equal(f.calls[0].method, 'PATCH')
  assert.equal(f.calls[0].headers.Authorization, 'Bearer synthetic-token')
  assert.deepEqual(JSON.parse(f.calls[0].body), { kind: 'contact', id: 'synthetic-0', status: 'resolved' })
  assert.equal(f.slots[4][1].status, 'new')
})

test('cancelled deletion cannot send a request or remove a record', async () => {
  const f = fixture()
  await f.click('Delete')
  assert.equal(f.calls.length, 0)
  assert.equal(f.slots[4].length, 2)
})

test('confirmed deletion retains its explicit warning and only removes the selected synthetic record', async () => {
  const f = fixture()
  let confirmation
  f.browser.confirm = message => { confirmation = message; return true }
  await f.click('Delete')
  await Promise.resolve()
  assert.match(confirmation, /cannot be undone/i)
  assert.equal(f.calls[0].method, 'DELETE')
  assert.deepEqual(JSON.parse(f.calls[0].body), { kind: 'contact', id: 'synthetic-0' })
  assert.deepEqual(f.slots[4].map(row => row.id), ['synthetic-1'])
})

test('contact metadata separates labels and full values, including long email addresses', () => {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compile('app/admin/submission-contact.tsx'))(name => name === '@phosphor-icons/react' ? icons : name.endsWith('.css') ? css : require(name), module, module.exports)
  const email = 'a'.repeat(64) + '@very-long-research-department.example.invalid'
  const markup = renderToStaticMarkup(React.createElement(module.exports.SubmissionContact, { email, phone: null, received: '15 Sept 2026', expires: '15 Dec 2026' }))
  assert.match(markup, /<dl[^>]+aria-label="Submission contact details"/)
  assert.equal((markup.match(/<dt>/g) || []).length, 4)
  assert.equal((markup.match(/<dd>/g) || []).length, 4)
  assert.ok(markup.includes(`href="mailto:${email}">${email}</a>`))
  assert.match(markup, /<dd>Not provided<\/dd>/)
  assert.equal(markup.includes('tel:'), false)
})

test('contact layout wraps values instead of truncating them and all new workspace rules are scoped', () => {
  const contact = readFileSync('app/admin/submission-contact.module.css', 'utf8')
  assert.match(contact, /minmax\(0, 1fr\)/)
  assert.match(contact, /overflow-wrap: anywhere/)
  assert.doesNotMatch(contact, /nowrap|ellipsis|overflow:\s*hidden/)
  const dashboard = readFileSync('app/admin/admin-dashboard.tsx', 'utf8')
  assert.match(dashboard, /admin-console \$\{styles\.workspace\}/)
  assert.match(dashboard, /<div hidden=\{!showJobs\}><JobPostings/)
})
