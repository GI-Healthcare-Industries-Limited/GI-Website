import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('careers starts with open roles and retains job links and location content', () => {
  const page = readFileSync('app/careers/page.tsx', 'utf8')
  assert.match(page, /<main[^>]*>\s*<section id="open-roles"/)
  assert.match(page, /<h1 id="open-roles-title">Open opportunities<\/h1>/)
  assert.match(page, /<h2>\{job.job_title\}<\/h2>/)
  assert.doesNotMatch(page, /Build something|that matters\.|Explore open roles|styles\.hero/)
  for (const retained of ['jobIsOpen(job)', 'href={jobPath(job.id)}', '<SiteHeader', '<SiteFooter', 'bg_video.mp4']) assert(page.includes(retained))
})
