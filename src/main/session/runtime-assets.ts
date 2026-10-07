import fs from 'fs'
import path from 'path'
import type { IpcContext } from '../ipc/context'

export const INDEX_RUNTIME_MARKER = '@ohmyppt-index-runtim:arcsin1:v2.0.19'
export const PPT_RUNTIME_MARKER = '@ohmyppt-ppt-runtime:arcsin1:v2.0.21'

const RUNTIME_ASSET_MARKERS = [
  { fileName: 'index-runtime.js', marker: INDEX_RUNTIME_MARKER },
  { fileName: 'ppt-runtime.js', marker: PPT_RUNTIME_MARKER }
] as const

const KATEX_ASSET_FILES = ['katex/katex.min.js', 'katex/katex.min.css'] as const

async function hasExpectedRuntimeMarker(projectDir: string, fileName: string, marker: string): Promise<boolean> {
  try {
    const content = await fs.promises.readFile(path.join(projectDir, 'assets', fileName), 'utf-8')
    return content.includes(marker)
  } catch {
    return false
  }
}

export async function ensureSessionRuntimeCompatible(
  ctx: IpcContext,
  projectDir: string
): Promise<void> {
  for (const { fileName, marker } of RUNTIME_ASSET_MARKERS) {
    if (!(await hasExpectedRuntimeMarker(projectDir, fileName, marker))) {
      await ctx.ensureSessionAssets(projectDir)
      return
    }
  }
  for (const fileName of KATEX_ASSET_FILES) {
    try {
      const [source, installed] = await Promise.all([
        fs.promises.readFile(ctx.resolveSessionAssetSourcePath(fileName)),
        fs.promises.readFile(path.join(projectDir, 'assets', fileName))
      ])
      if (source.equals(installed)) continue
    } catch {
      // Missing assets use the same refresh path as an older runtime marker.
    }
    await ctx.ensureSessionAssets(projectDir)
    return
  }
}
