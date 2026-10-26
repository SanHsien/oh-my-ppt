import { describe, expect, it } from 'vitest'

import {
  extractImpliedPageCount,
  normalizeGeneratedPlan
} from '../../../src/main/io/document-plan-normalizer'

describe('document parse plan page count normalization', () => {
  it('uses English per-page entries when the model collapses pageCount to one', () => {
    const result = normalizeGeneratedPlan(
      JSON.stringify({
        topic: 'Product Launch Readiness Review',
        pageCount: 1,
        briefText: [
          'Presentation goal: Review launch readiness.',
          'Recommended outline:',
          '1. Context',
          '2. Market signal',
          '3. Product readiness',
          '4. GTM risks',
          '5. Timeline',
          '6. Decision points',
          'Per-page points:',
          'Page 1: Context',
          'Page 2: Market signal',
          'Page 3: Product readiness',
          'Page 4: GTM risks',
          'Page 5: Timeline',
          'Page 6: Decision points'
        ].join('\n')
      }),
      { topic: '', pageCount: null, briefText: '' }
    )

    expect(result.pageCount).toBe(6)
  })

  it('keeps an explicit user page count even when the outline has more entries', () => {
    const result = normalizeGeneratedPlan(
      JSON.stringify({
        topic: 'Product Launch Readiness Review',
        pageCount: 1,
        briefText: ['Recommended outline:', '1. Context', '2. Market signal'].join('\n')
      }),
      { topic: '', pageCount: 1, briefText: '' }
    )

    expect(result.pageCount).toBe(1)
  })

  it('counts English Page N labels in per-page sections', () => {
    expect(
      extractImpliedPageCount(['Per-page points:', 'Page 1: A', 'Page 2: B', 'Page 3: C'].join('\n'))
    ).toBe(3)
  })

  // Reference documents and model replies are frequently Simplified; the Traditional conversion
  // left only Traditional spellings in the page-count patterns and the localized JSON keys.
  it('counts Simplified 第N页 labels and numbered outline sections', () => {
    expect(extractImpliedPageCount(['第 1 页：背景', '第 2 页：方案', '第 3 页：总结'].join('\n'))).toBe(3)
    expect(extractImpliedPageCount(['第一页：背景', '第两页：方案', '第三页：总结'].join('\n'))).toBe(3)
    expect(extractImpliedPageCount(['建议大纲', '1. 背景', '2. 方案', '3. 里程碑', '4. 风险'].join('\n'))).toBe(4)
    expect(extractImpliedPageCount(['每页要点：', '1. 背景', '2. 方案', '必须保留：', '3. 不该计入'].join('\n'))).toBe(2)
  })

  it('stops counting numbered outline items at an audience line in either spelling', () => {
    for (const audience of ['受眾：管理層', '受衆：管理層', '受众：管理层']) {
      expect(extractImpliedPageCount(['每頁要點：', '1. 背景', '2. 方案', audience, '3. 不該計入'].join('\n'))).toBe(2)
    }
  })

  it('reads localized Simplified keys from the model reply', () => {
    const result = normalizeGeneratedPlan(
      JSON.stringify({ 主题: '年度汇报', 页数: 8, 详细描述: '面向管理层的年度回顾' }),
      { topic: '', pageCount: null, briefText: '' }
    )
    expect(result).toEqual({ topic: '年度汇报', pageCount: 8, briefText: '面向管理层的年度回顾' })
  })

  it('still reads localized Traditional keys from the model reply', () => {
    const result = normalizeGeneratedPlan(
      JSON.stringify({ 主題: '年度彙報', 頁數: 8, 詳細描述: '面向管理層的年度回顧' }),
      { topic: '', pageCount: null, briefText: '' }
    )
    expect(result).toEqual({ topic: '年度彙報', pageCount: 8, briefText: '面向管理層的年度回顧' })
  })
})
