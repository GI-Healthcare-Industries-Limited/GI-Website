import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = ts.transpileModule(readFileSync('app/api/admin/submissions/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function fixture({ admin = { userId: 'admin-id' } } = {}) {
  const calls = []
  let databaseAccesses = 0

  class Query {
    constructor(table) {
      this.table = table
      this.operation = 'lookup'
      this.id = null
    }
    delete() {
      this.operation = 'delete'
      return this
    }
    eq(column, value) {
      if (column === 'id') this.id = value
      return this
    }
    select() { return this }
    async maybeSingle() {
      calls.push({ table: this.table, operation: this.operation, id: this.id })
      if (this.operation === 'lookup') return { data: { cv_path: 'legacy/test.pdf' }, error: null }
      return { data: { id: this.id }, error: null }
    }
  }

  const supabase = {
    from(table) {
      databaseAccesses += 1
      return new Query(table)
    },
    storage: {
      from(bucket) {
        return {
          async remove(paths) {
            calls.push({ bucket, operation: 'storage-remove', paths })
            return { error: null }
          },
        }
      },
    },
  }

  const module = { exports: {} }
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@/lib/admin-auth') return { requireWebsiteAdmin: async () => admin }
    if (name === '@/lib/submission-constants') {
      return { applicationStatuses: ['new'], contactStatuses: ['new'] }
    }
    if (name === '@/lib/supabase/admin') return { getSupabaseAdmin: () => supabase }
    return require(name)
  }, module, module.exports)

  return {
    DELETE: module.exports.DELETE,
    calls,
    get databaseAccesses() { return databaseAccesses },
  }
}

function deletionRequest(body) {
  return new Request('https://www.gihealthcare.co.uk/api/admin/submissions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('submission deletion rejects unauthorised requests without database access', async () => {
  const f = fixture({ admin: null })
  const response = await f.DELETE(deletionRequest({ kind: 'contact', id: 'message-id' }))

  assert.equal(response.status, 401)
  assert.equal(f.databaseAccesses, 0)
})

test('submission deletion validates its kind and id before database access', async () => {
  const f = fixture()
  const response = await f.DELETE(deletionRequest({ kind: 'unknown', id: '' }))

  assert.equal(response.status, 400)
  assert.equal(f.databaseAccesses, 0)
})

test('contact deletion targets only the selected contact record', async () => {
  const f = fixture()
  const response = await f.DELETE(deletionRequest({ kind: 'contact', id: 'message-id' }))

  assert.equal(response.status, 200)
  assert.deepEqual(f.calls, [
    { table: 'contact_submissions', operation: 'delete', id: 'message-id' },
  ])
})

test('application deletion removes its row and any legacy CV', async () => {
  const f = fixture()
  const response = await f.DELETE(deletionRequest({ kind: 'application', id: 'application-id' }))

  assert.equal(response.status, 200)
  assert.deepEqual(f.calls, [
    { table: 'career_applications', operation: 'lookup', id: 'application-id' },
    { table: 'career_applications', operation: 'delete', id: 'application-id' },
    { bucket: 'career-cvs', operation: 'storage-remove', paths: ['legacy/test.pdf'] },
  ])
})
