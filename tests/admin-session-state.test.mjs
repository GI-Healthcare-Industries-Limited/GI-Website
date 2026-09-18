import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

function constants(path) {
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  new Function('module', 'exports', code)(module, module.exports)
  return module.exports
}

test('token refreshes for the same admin preserve the selected candidate', () => {
  const { shouldResetAdminWorkspace } = constants('lib/admin-session-state.ts')
  assert.equal(shouldResetAdminWorkspace('admin-1', 'admin-1'), false)
  assert.equal(shouldResetAdminWorkspace(null, null), false)
})

test('sign-out and a different admin identity reset private workspace state', () => {
  const { shouldResetAdminWorkspace } = constants('lib/admin-session-state.ts')
  assert.equal(shouldResetAdminWorkspace('admin-1', null), true)
  assert.equal(shouldResetAdminWorkspace(null, 'admin-1'), true)
  assert.equal(shouldResetAdminWorkspace('admin-1', 'admin-2'), true)
})

test('the auth listener only clears the workspace after an identity change', () => {
  const source = readFileSync('app/admin/admin-dashboard.tsx', 'utf8')
  assert.match(source, /const resetWorkspace = shouldResetAdminWorkspace\(activeAdminUserId\.current, nextUserId\)/)
  assert.match(source, /if \(resetWorkspace\) \{\s*setItems\(\[\]\)\s*setSelectedId\(null\)\s*setSearchQuery\(''\)\s*\}/)
  assert.match(source, /const activeSession = sessionRef\.current/)
  assert.match(source, /authenticatedFetch\(activeSession, `\/api\/admin\/submissions/)
  assert.match(source, /\[kind, sessionUserId, statusFilter, endSession\]/)
  assert.doesNotMatch(source, /\[kind, session, statusFilter, endSession\]/)
})
