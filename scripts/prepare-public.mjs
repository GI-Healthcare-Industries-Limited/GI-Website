import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'

const repositoryRoot = process.cwd()
const sourceDirectory = path.join(repositoryRoot, 'docs')
const outputDirectory = path.join(repositoryRoot, 'public')

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
  if (entry.name === 'CNAME' || entry.name === '.DS_Store') continue

  await cp(
    path.join(sourceDirectory, entry.name),
    path.join(outputDirectory, entry.name),
    { recursive: true },
  )
}
