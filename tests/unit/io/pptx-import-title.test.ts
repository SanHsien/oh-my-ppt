import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '') },
  BrowserWindow: vi.fn()
}))

vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))

const { __pptxImporterTestUtils } = await import('../../../src/main/io/pptx-import')
const { isLowValueTitleText, hasDeckTitleKeyword } = __pptxImporterTestUtils

// Imported decks are often Simplified (or Taiwan-standard Traditional); the title heuristics must read
// them like their Traditional twins. See src/shared/han-variants.ts.
describe('pptx import title heuristics', () => {
  it('treats Simplified placeholder text as a low-value title', () => {
    expect(isLowValueTitleText('單擊此處輸入標題')).toBe(true)
    expect(isLowValueTitleText('单击此处输入标题')).toBe(true)
    expect(isLowValueTitleText('请输入文字')).toBe(true)
    expect(isLowValueTitleText('年度經營回顧')).toBe(false)
  })

  it('recognizes Simplified deck title keywords', () => {
    expect(hasDeckTitleKeyword('年度工作彙報')).toBe(true)
    expect(hasDeckTitleKeyword('年度工作汇报')).toBe(true)
    expect(hasDeckTitleKeyword('项目复盘')).toBe(true)
    expect(hasDeckTitleKeyword('目录')).toBe(true)
    expect(hasDeckTitleKeyword('產品照片')).toBe(false)
  })
})
