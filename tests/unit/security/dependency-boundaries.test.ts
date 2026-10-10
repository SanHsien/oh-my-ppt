import { createRequire } from 'node:module'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const braces = require('braces')
const micromatch = require('micromatch')
const glob = require('fast-glob')
const { sprintf } = require('sprintf-js')
const CachePolicy = require('http-cache-semantics')

describe('patched transitive dependency security boundaries', () => {
  it.each(['{', '('])('rejects deep %s nesting before recursive AST consumers', (open) => {
    const close = open === '{' ? '}' : ')'
    const balanced = open.repeat(4000) + 'x' + close.repeat(4000)
    for (const input of [balanced, open.repeat(4000) + 'x']) {
      for (const operation of [braces, braces.parse, braces.compile, braces.expand]) {
        expect(() => operation(input)).toThrow(/safe limit/)
      }
      if (open === '{' && input.endsWith('}')) expect(() => micromatch.braceExpand(input.replace('x', 'x,y'))).toThrow()
    }
  })

  it('preserves electron-builder minimatch brace-expansion API', () => {
    const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'))
    const { Minimatch } = builderRequire('minimatch')
    const matcher = new Minimatch('!{.env,.npmrc}')
    expect(matcher.match('deck.json')).toBe(true)
    expect(matcher.match('.env')).toBe(false)
  })

  it('keeps normal nested alternatives and fast-glob file matching', async () => {
    expect(braces.expand('{a,{b,c}}')).toEqual(['a', 'b', 'c'])
    expect(micromatch(['a.ts', 'b.js', 'c.json'], '*.{ts,js}')).toEqual(['a.ts', 'b.js'])
    const root = await mkdtemp(path.join(tmpdir(), 'ohmyppt-security-glob-'))
    try {
      await writeFile(path.join(root, 'a.ts'), '')
      await writeFile(path.join(root, 'b.js'), '')
      expect((await glob('*.{ts,js}', { cwd: root })).sort()).toEqual(['a.ts', 'b.js'])
      await expect(glob('{'.repeat(100) + 'x,y' + '}'.repeat(100), { cwd: root })).rejects.toThrow(/safe limit/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it.each(['f', 'e', 'g'])('bounds excessive %s precision without a RangeError', (type) => {
    expect(() => sprintf('%.' + '9'.repeat(400) + type, 1.25)).not.toThrow()
    expect(sprintf('%.' + '9'.repeat(400) + type, 1.25)).toBe(sprintf('%.100' + type, 1.25))
  })

  it('preserves normal formatter arguments including argparse usage', () => {
    expect(sprintf('%s %.2f %d', 'deck', 1.25, 3)).toBe('deck 1.25 3')
    expect(sprintf('%(name)s', { name: 'deck' })).toBe('deck')
    const { ArgumentParser } = require('argparse')
    const parser = new ArgumentParser({ addHelp: false })
    parser.addArgument('--title')
    expect(parser.parseArgs(['--title', 'synthetic']).title).toBe('synthetic')
  })

  it.each([
    { 'set-cookie': 'session=synthetic' },
    { 'cache-control': 'private, max-age=60' },
    { 'cache-control': 'no-store' },
    { 'cache-control': 'no-cache, stale-while-revalidate=999999, stale-if-error=999999' },
    { 'cache-control': 'proxy-revalidate, max-age=60' }
  ])('never serves security-zeroed entries through max-stale: %j', (headers) => {
    const req = { url: 'https://synthetic.invalid/deck', method: 'GET', headers: { host: 'synthetic.invalid' } }
    const policy = new CachePolicy(req, { status: 200, headers }, { shared: true })
    expect(policy.maxAge()).toBe(0)
    for (const maxStale of ['max-stale', 'max-stale=999999999']) {
      const next = { ...req, headers: { ...req.headers, 'cache-control': maxStale } }
      for (const candidate of [policy, CachePolicy.fromObject(policy.toObject())]) {
        expect(candidate.satisfiesWithoutRevalidation(next)).toBe(false)
        expect(candidate.evaluateRequest(next).response).toBeUndefined()
        expect(candidate.useStaleWhileRevalidate()).toBe(false)
        expect(candidate._useStaleIfError()).toBe(false)
      }
    }
  })

  it('retains allowed stale reuse for positive public freshness', () => {
    const req = { url: 'https://synthetic.invalid/deck', headers: { host: 'synthetic.invalid' } }
    const policy = new CachePolicy(req, { status: 200, headers: { 'cache-control': 'public, max-age=60' } })
    policy._responseTime -= 120000
    expect(policy.satisfiesWithoutRevalidation({ ...req, headers: { ...req.headers, 'cache-control': 'max-stale=300' } })).toBe(true)
  })

  it('retains explicitly public fresh cache hits', () => {
    const req = { url: 'https://synthetic.invalid/deck', headers: { host: 'synthetic.invalid' } }
    const policy = new CachePolicy(req, { status: 200, headers: { 'cache-control': 'public, max-age=60' } })
    expect(policy.satisfiesWithoutRevalidation(req)).toBe(true)
  })
})


