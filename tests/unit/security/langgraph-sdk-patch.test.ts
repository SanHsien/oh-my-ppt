import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(__dirname, '../../..')
const SDK = '@langchain/langgraph-sdk'

function patchKeys(): string[] {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
  return Object.keys(pkg.pnpm?.patchedDependencies ?? {}).filter((key) => key.startsWith(`${SDK}@`))
}

describe('@langchain/langgraph-sdk ESM packaging patch', () => {
  // Dependabot runs `pnpm update <dep> --lockfile-only`, which re-resolves transitive
  // dependencies inside their parents' ranges (@langchain/langgraph pins `~1.12.x`).
  // An exact-version patch key is then orphaned and pnpm fails every Dependabot job
  // with ERR_PNPM_UNUSED_PATCH. The key must therefore be a range, not an exact version.
  it('keys the patch by a version range so transitive re-resolution cannot orphan it', () => {
    const keys = patchKeys()
    expect(keys).toHaveLength(1)
    const range = keys[0].slice(SDK.length + 1)
    expect(range).not.toMatch(/^\d+\.\d+\.\d+$/)
    expect(range).toMatch(/^[~^]\d+\.\d+\.\d+$|^\d+\.(x|\d+\.x)$/)
  })

  // electron-builder does not collect the nested `.pnpm` directory the published ESM file
  // points into, so an unpatched install crashes the packaged app at startup.
  it('leaves no import pointing into an embedded node_modules/.pnpm tree', () => {
    const entry = require.resolve(`${SDK}/package.json`)
    const source = readFileSync(
      path.join(path.dirname(entry), 'dist/utils/async_caller.js'),
      'utf8'
    )
    expect(source).not.toMatch(/from\s+["'][^"']*node_modules\/\.pnpm\//)
    expect(source).toMatch(/from\s+["']p-retry["']/)
    expect(source).toMatch(/from\s+["']p-queue["']/)
  })
})
