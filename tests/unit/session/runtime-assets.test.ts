import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { IpcContext } from '../../../src/main/ipc/context'
import {
  ensureSessionRuntimeCompatible,
  INDEX_RUNTIME_MARKER,
  PPT_RUNTIME_MARKER
} from '../../../src/main/session/runtime-assets'

const directories: string[] = []

async function createFixture() {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ohmyppt-runtime-assets-'))
  directories.push(root)
  const sourceDir = path.join(root, 'source')
  const projectDir = path.join(root, 'project')
  await fs.promises.mkdir(path.join(sourceDir, 'katex'), { recursive: true })
  await fs.promises.mkdir(path.join(projectDir, 'assets', 'katex'), { recursive: true })
  await fs.promises.writeFile(path.join(projectDir, 'assets', 'index-runtime.js'), INDEX_RUNTIME_MARKER)
  await fs.promises.writeFile(path.join(projectDir, 'assets', 'ppt-runtime.js'), PPT_RUNTIME_MARKER)
  for (const fileName of ['katex.min.js', 'katex.min.css']) {
    await fs.promises.writeFile(path.join(sourceDir, 'katex', fileName), `current ${fileName}`)
    await fs.promises.writeFile(path.join(projectDir, 'assets', 'katex', fileName), `current ${fileName}`)
  }
  const ensureSessionAssets = vi.fn(async () => {})
  const ctx = {
    resolveSessionAssetSourcePath: (fileName: string) => path.join(sourceDir, fileName),
    ensureSessionAssets
  } as unknown as IpcContext
  return { ctx, ensureSessionAssets, projectDir }
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true })))
})

describe('session KaTeX assets', () => {
  it('keeps matching assets', async () => {
    const { ctx, ensureSessionAssets, projectDir } = await createFixture()
    await ensureSessionRuntimeCompatible(ctx, projectDir)
    expect(ensureSessionAssets).not.toHaveBeenCalled()
  })

  it('refreshes an older KaTeX script even with current runtime markers', async () => {
    const { ctx, ensureSessionAssets, projectDir } = await createFixture()
    await fs.promises.writeFile(path.join(projectDir, 'assets', 'katex', 'katex.min.js'), 'old script')
    await ensureSessionRuntimeCompatible(ctx, projectDir)
    expect(ensureSessionAssets).toHaveBeenCalledOnce()
    expect(ensureSessionAssets).toHaveBeenCalledWith(projectDir)
  })

  it('refreshes a missing KaTeX stylesheet', async () => {
    const { ctx, ensureSessionAssets, projectDir } = await createFixture()
    await fs.promises.rm(path.join(projectDir, 'assets', 'katex', 'katex.min.css'))
    await ensureSessionRuntimeCompatible(ctx, projectDir)
    expect(ensureSessionAssets).toHaveBeenCalledOnce()
  })
})
