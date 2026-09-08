import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = ts.transpileModule(readFileSync('app/admin/admin-login.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText

// Exercise the production component's handlers with isolated hooks and auth.
// No credentials, emails, sessions, or production records are changed.
function fixture(authOverrides = {}, propOverrides = {}) {
  const calls = []
  const slots = []
  let cursor = 0
  let tree
  const props = {
    supabase: { auth: Object.fromEntries(['signInWithPassword', 'resetPasswordForEmail', 'updateUser'].map(name => [name, async (...args) => {
      calls.push({ name, args })
      return authOverrides[name] ? authOverrides[name](...args) : { error: null }
    }])) },
    checkingSession: false, recoveringPassword: false,
    onPasswordUpdated: () => calls.push({ name: 'passwordUpdated' }),
    ...propOverrides,
  }
  const hooks = {
    ...require('react'),
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
    },
    useRef(initial) {
      const index = cursor++
      return slots[index] ??= { current: initial }
    },
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'FormData', 'window', source)(name => {
    if (name === 'react') return hooks
    if (name === '@phosphor-icons/react') return { ArrowSquareOutIcon: () => null, EyeIcon: () => null, EyeSlashIcon: () => null }
    if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => String(key) })
    if (name.startsWith('@/assets/')) return { src: 'test-asset', width: 230, height: 67 }
    if (name.startsWith('next/')) return () => null
    return require(name)
  }, module, module.exports, class {
    constructor(form) { this.values = form.values }
    get(name) { return this.values[name] ?? null }
  }, { location: { origin: 'https://www.gihealthcare.co.uk' } })
  function render() { cursor = 0; tree = module.exports.AdminLogin(props); return tree }
  function nodes(node = tree) {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return node.flatMap(nodes)
    return [node, ...nodes(node.props?.children ?? null)]
  }
  const find = predicate => nodes().find(predicate)
  render()
  return {
    calls, props, render, nodes, find,
    click: label => { find(n => n.type === 'button' && n.props.children === label).props.onClick(); render() },
    async submit(values) {
      await find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { values, reset() {} } })
      render()
    },
  }
}

test('login keeps blank fields, accessible labels, autocomplete and real action controls', () => {
  const f = fixture()
  const inputs = f.nodes().filter(n => n.type === 'input')
  assert.equal(inputs.length, 2)
  assert.ok(inputs.every(n => n.props.placeholder === undefined && n.props.required))
  assert.deepEqual(inputs.map(n => n.props.autoComplete), ['username', 'current-password'])
  assert.ok(f.nodes().filter(n => n.type === 'label').every(n => n.props.className === 'sr-only'))
  assert.ok(f.find(n => n.props?.['aria-label'] === 'Show password'))
})

test('sign-in sends the supplied credentials to existing Supabase auth', async () => {
  const f = fixture()
  await f.submit({ email: ' ash@example.com ', password: 'test-only-password' })
  assert.deepEqual(f.calls, [{ name: 'signInWithPassword', args: [{ email: 'ash@example.com', password: 'test-only-password' }] }])
})

test('failed sign-in is visible and submit becomes available again', async () => {
  const f = fixture({ signInWithPassword: () => { throw new Error('Connection unavailable') } })
  await f.submit({ email: 'test@example.com', password: 'test-only-password' })
  assert.equal(f.find(n => n.props?.role === 'alert').props.children, 'Connection unavailable')
  assert.equal(f.find(n => n.props?.type === 'submit').props.disabled, false)
})

test('password reset uses the same admin route and does not disclose whether the account exists', async () => {
  const f = fixture()
  f.click('Forgot password?')
  assert.equal(f.nodes().filter(n => n.type === 'input').length, 1)
  await f.submit({ email: 'test@example.com' })
  assert.deepEqual(f.calls[0], { name: 'resetPasswordForEmail', args: ['test@example.com', { redirectTo: 'https://www.gihealthcare.co.uk/admin' }] })
  assert.match(f.find(n => n.props?.role === 'status').props.children, /If this address has an account/)
  f.click('Back to sign in')
  assert.equal(f.nodes().filter(n => n.type === 'input').length, 2)
})

test('recovery validates password length and confirmation before updating auth', async () => {
  const f = fixture({}, { recoveringPassword: true })
  await f.submit({ password: 'short', confirmation: 'short' })
  assert.equal(f.calls.length, 0)
  await f.submit({ password: 'long-enough-password', confirmation: 'different-password' })
  assert.equal(f.calls.length, 0)
  await f.submit({ password: 'long-enough-password', confirmation: 'long-enough-password' })
  assert.deepEqual(f.calls.map(c => c.name), ['updateUser', 'passwordUpdated'])
})

test('missing client or pending session cannot submit', async () => {
  for (const props of [{ supabase: null }, { checkingSession: true }]) {
    const f = fixture({}, props)
    await f.submit({ email: 'test@example.com', password: 'test-only-password' })
    assert.equal(f.calls.length, 0)
    assert.equal(f.find(n => n.props?.type === 'submit').props.disabled, true)
  }
})

test('rapid duplicate submissions only make one auth request', async () => {
  let finish
  const f = fixture({ signInWithPassword: () => new Promise(resolve => { finish = resolve }) })
  const first = f.submit({ email: 'test@example.com', password: 'test-only-password' })
  await f.submit({ email: 'test@example.com', password: 'test-only-password' })
  assert.equal(f.calls.length, 1)
  finish({ error: null })
  await first
})
