import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '') }, BrowserWindow: vi.fn() }))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))

const { assertImageWasRead } = await import('../../../src/main/styles/import/image')

describe('assertImageWasRead', () => {
  it('rejects a Simplified "no image" reply like its Traditional twin', () => {
    // Models answer in either script; see src/shared/han-variants.ts.
    expect(() => assertImageWasRead('抱歉，未提供圖片')).toThrow()
    expect(() => assertImageWasRead('抱歉，未提供图片')).toThrow()
    expect(() => assertImageWasRead('没有图片可以分析')).toThrow()
  })

  it('accepts a reply that describes the image', () => {
    expect(() => assertImageWasRead('畫面以藍色為主，左上角有標題。')).not.toThrow()
  })
})
