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
    // A year followed by PPT is a real title, not the 1ppt.com template watermark.
    expect(isLowValueTitleText('2021PPT 年度工作總結')).toBe(false)
    expect(isLowValueTitleText('www.1ppt.com 模板')).toBe(true)
  })

  it('matches the 1ppt.com watermark as a whole host, not as a substring', () => {
    // The domain itself, a subdomain, a scheme-less path and mixed case are all the watermark.
    expect(isLowValueTitleText('1ppt.com')).toBe(true)
    expect(isLowValueTitleText('WWW.1PPT.COM')).toBe(true)
    expect(isLowValueTitleText('cdn.1ppt.com')).toBe(true)
    expect(isLowValueTitleText('更多模板請見 1ppt.com/ppt。')).toBe(true)
    expect(isLowValueTitleText('1ppt.com模板下載')).toBe(true)
    expect(isLowValueTitleText('https://static.1ppt.com/a.png')).toBe(true)
    // Another host that merely contains the string is a real title candidate.
    expect(isLowValueTitleText('evil-1ppt.com')).toBe(false)
    expect(isLowValueTitleText('my1ppt.com')).toBe(false)
    expect(isLowValueTitleText('1ppt.com.example.org')).toBe(false)
    expect(isLowValueTitleText('1ppt.company 年度報告')).toBe(false)
    expect(isLowValueTitleText('docs.example.org/1ppt.com-guide')).toBe(false)
  })

  it('recognizes Simplified deck title keywords', () => {
    expect(hasDeckTitleKeyword('年度工作彙報')).toBe(true)
    expect(hasDeckTitleKeyword('年度工作汇报')).toBe(true)
    expect(hasDeckTitleKeyword('项目复盘')).toBe(true)
    expect(hasDeckTitleKeyword('目录')).toBe(true)
    expect(hasDeckTitleKeyword('產品照片')).toBe(false)
  })
})
