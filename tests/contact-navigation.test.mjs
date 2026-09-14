import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

test('public contact actions target the same-domain contact form', () => {
  for (const path of ['app/apply/apply-form.tsx','app/apply/eligibility-check.tsx']) {
    const source=readFileSync(path,'utf8')
    assert.match(source,/href="\/contact"/)
    assert.doesNotMatch(source,/mailto:/)
  }
  const footer=readFileSync('frontend/lib/widgets/footer.dart','utf8')
  assert.match(footer,/Helpers\.SendToSameTab\('\/contact'\)/)
  assert.doesNotMatch(footer,/mailto:/)
  const helper=readFileSync('frontend/lib/utils/helpers.dart','utf8')
  assert.match(helper,/Uri\.base\.resolve\(url\)/)
  assert.match(helper,/launchUrlString\(destination, webOnlyWindowName: '_self'\)/)
})

test('public pages and fallback messages publish no business email addresses or phone numbers', () => {
  function sources(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) return ['app/admin', 'app/api'].includes(path) ? [] : sources(path)
      return /\.(tsx?|dart)$/.test(path) ? [path] : []
    })
  }
  const paths = [...sources('app'), ...sources('frontend/lib'), 'lib/submissions.ts']
  for (const path of paths) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /[\w.+-]+@gihealthcare\.(co\.uk|com)|(?:mailto|tel):|\+?44[ -]?131[ -]?392[ -]?8881|0\d{3}[ -]\d{3}[ -]\d{4}/i, path)
  }
  for (const path of ['app/error.tsx', 'app/privacy/page.tsx']) assert.match(readFileSync(path, 'utf8'), /href="\/contact"/)
  assert.match(readFileSync('frontend/lib/pages/careers_page.dart', 'utf8'), /Helpers\.SendToSameTab\('\/contact'\)/)
})
