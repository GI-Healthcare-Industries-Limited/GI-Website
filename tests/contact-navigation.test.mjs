import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
