import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

function constants(path) {
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function('module', 'exports', code)(module, module.exports)
  return module.exports
}

test('contact navigation links match the public-site section allow-list', () => {
  const { SITE_NAVIGATION } = constants('lib/site-navigation.ts')
  assert.deepEqual(SITE_NAVIGATION, [
    { label: 'Home', href: '/' }, { label: 'About us', href: '/?page=about' },
    { label: 'Military', href: '/?page=military' }, { label: 'Space', href: '/?page=space' },
    { label: 'Careers', href: '/?page=careers' }, { label: 'Contact us', href: '/contact' },
  ])
  const dart = readFileSync('frontend/lib/utils/site_routes.dart', 'utf8')
  for (const item of SITE_NAVIGATION.slice(1, -1)) assert(dart.includes(`'${new URL(item.href, 'https://example.invalid').searchParams.get('page')}'`))
  const header = readFileSync('app/contact/site-header.tsx', 'utf8')
  assert.match(header, /<a key={item.href} href={item.href}/)
  assert.match(header, /aria-current=/)
  assert.match(header, /<details/)
  assert.match(header, /Skip to content/)
  assert.match(readFileSync('frontend/lib/main.dart', 'utf8'), /location.initializeNavigation\(\);[\s\S]*runApp\(/)
  assert.match(readFileSync('frontend/lib/utils/site_location_web.dart', 'utf8'), /setUrlStrategy\(null\)/)
})

test('contact has a public website shell and a separate illustrative image', () => {
  const page = readFileSync('app/contact/page.tsx', 'utf8')
  const form = readFileSync('app/contact/contact-form.tsx', 'utf8')
  assert.match(page, /<SiteHeader/)
  assert.match(page, /<main/)
  assert.match(page, /<footer/)
  assert.match(page, /assets\/contact\/field-kitchen.webp/)
  assert.match(page, /Illustrative concept/)
  assert.doesNotMatch(page + form, /Back to website|cooking-studio/)
})

test('questions give context while leaving answers open and keeping failure unchanged', () => {
  const questions = constants('lib/application-questions.ts')
  assert.equal(questions.FAILURE_QUESTION, 'What’s your biggest failure?')
  assert.match(questions.WORK_QUESTION, /built or created.*apps.*open-source.*research.*links/)
  assert.match(questions.AWARDS_QUESTION, /what you won and what it was for/)
  assert.match(questions.GROWTH_QUESTION, /friends.*work on.*Why/)
  assert.deepEqual(questions.ANSWER_WORD_LIMITS, { award: 20, work: 80, failure: 50, growth: 40 })
  for (const question of [questions.AWARDS_QUESTION, questions.WORK_QUESTION, questions.GROWTH_QUESTION]) assert(question.split(/\s+/).length <= 30)
})

test('all public pages use the new header, without changing the application or admin shells', () => {
  for (const name of ['home','about','military','space','careers']) {
    const source = readFileSync(`frontend/lib/pages/${name}_page.dart`, 'utf8')
    assert.match(source, /const NavBar\(\)/)
    assert.doesNotMatch(source, /NavBar\(\s*isTransparent/)
  }
  const header = readFileSync('frontend/lib/widgets/navigation_bar.dart', 'utf8')
  assert.match(header, /0xFFE82127/)
  assert.match(header, /fontFamily: 'Inter'/)
  assert.match(header, /gi-healthcare-header-logo.webp/)
  assert.doesNotMatch(header, /white_butterfly|HoverUnderlineText|isTransparent/)
  assert.match(readFileSync('app/privacy/page.tsx','utf8'), /<SiteHeader activePath="\/privacy"/)
})

test('main-page logo reuses the Contact rendering without a display-specific colour profile', () => {
  const logo = readFileSync('frontend/assets/images/gi-healthcare-header-logo.webp')
  assert.equal(logo.subarray(0, 4).toString(), 'RIFF')
  assert.equal(logo.subarray(8, 12).toString(), 'WEBP')
  // Inspect container chunks, not decoded pixels: no device-specific ICC profile
  // may be reintroduced into the Flutter canvas header.
  for (let offset = 12; offset + 8 <= logo.length;) {
    const chunk = logo.subarray(offset, offset + 4).toString()
    assert.notEqual(chunk, 'ICCP')
    const size = logo.readUInt32LE(offset + 4)
    offset += 8 + size + (size % 2)
  }
  assert.match(readFileSync('frontend/pubspec.yaml', 'utf8'), /assets\/images\/gi-healthcare-header-logo.webp/)
  assert.deepEqual(readFileSync('docs/assets/assets/images/gi-healthcare-header-logo.webp'), logo)
})

test('award cards override the tall global textarea minimum and added work links are optional', () => {
  const css = readFileSync('app/apply/apply-form.module.css', 'utf8')
  assert.match(css, /\.awardCard textarea \{[^}]*min-height: 0;[^}]*height: 2.8em/)
  const questions = readFileSync('app/apply/application-questions.tsx', 'utf8')
  assert.match(questions, /name="workLink" type="url"/)
  assert.doesNotMatch(questions, /name="workLink"[^>]*required/)
  assert.match(questions, /Remove link/)
  assert.match(readFileSync('app/apply/apply-form.tsx','utf8'), /workLinks: formData.getAll\('workLink'\)/)
})
