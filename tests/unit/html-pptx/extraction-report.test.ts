import { describe, expect, it } from 'vitest'
import { buildExtractionReportWarning } from '../../../src/main/io/html-pptx/extraction-report'

describe('PPTX extraction report warning', () => {
  it('reports editable-export fallbacks without claiming that content was dropped', () => {
    expect(
      buildExtractionReportWarning('page-1', {
        textLimitReached: true,
        shapeLimitReached: false,
        imageLimitReached: true,
        unsupportedTransformCount: 2,
        imageRasterFallbackCount: 1
      })
    ).toBe(
      '頁面 page-1：可編輯文本達到上限，剩餘文本已保留在背景圖；可編輯圖片達到上限，剩餘圖片已保留在背景圖；2 個複雜變換元素已保留在背景圖；1 個圖片或圖表無法安全轉換，已保留在背景圖'
    )
  })

  it('omits the warning when extraction has no fallback report', () => {
    expect(buildExtractionReportWarning('page-1', undefined)).toBeUndefined()
  })
})
