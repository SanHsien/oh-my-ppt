import { describe, expect, it } from 'vitest'
import {
  buildThinkingPageOutline,
  buildThinkingSourcePlan
} from '../../../src/main/thinking/source-plan'

describe('thinking source plan', () => {
  it('returns null when thinking.md has no page headings', () => {
    const sourcePlan = buildThinkingSourcePlan(
      ['# Thinking Brief', '', '## Topic', '只有主題，沒有頁面'].join('\n'),
      '/tmp/thinking.md'
    )

    expect(sourcePlan).toBeNull()
  })

  it('builds compact range-bound skeletons for 100-page thinking briefs', () => {
    const pages = Array.from({ length: 100 }, (_, index) => {
      const pageNumber = index + 1
      return [
        `## Page ${pageNumber}: 第 ${pageNumber} 頁主題`,
        '- Role: content',
        `- Objective: 說明第 ${pageNumber} 頁的核心任務`,
        '',
        `這一頁總結第 ${pageNumber} 個主題的關鍵背景、判斷和行動方向。`,
        '',
        `- 保留第 ${pageNumber} 頁的事實邊界`,
        `- 展開第 ${pageNumber} 頁的關鍵論據`,
        `- 給出第 ${pageNumber} 頁的表達重點`
      ].join('\n')
    })
    const thinkingMd = ['# Thinking Brief', '## Topic', '百頁方案', '', ...pages].join('\n')

    const sourcePlan = buildThinkingSourcePlan(thinkingMd, '/tmp/thinking.md')

    expect(sourcePlan?.pageSkeleton).toHaveLength(100)
    expect(sourcePlan?.pageSkeleton[0]).toMatchObject({
      pageNumber: 1,
      title: '第 1 頁主題',
      sourceHeading: 'Page 1: 第 1 頁主題'
    })
    expect(sourcePlan?.pageSkeleton[99]).toMatchObject({
      pageNumber: 100,
      title: '第 100 頁主題'
    })
    for (const item of sourcePlan?.pageSkeleton ?? []) {
      expect(item.lineEnd).toBeGreaterThanOrEqual(item.lineStart)
      expect(item.reason).toContain(`第 ${item.pageNumber} 頁`)
      expect(item.reason.length).toBeLessThanOrEqual(520)
    }
  })

  it('keeps summary and key points in a bounded page outline', () => {
    const outline = buildThinkingPageOutline([
      '- Role: content',
      '- Objective: 建立核心判斷',
      '',
      '總結第一句。',
      '總結第二句。',
      '',
      '- 關鍵點一',
      '- 關鍵點二',
      '- 關鍵點三',
      '- 關鍵點四',
      '- 關鍵點五',
      '- 關鍵點六',
      '- 關鍵點七',
      '- 關鍵點八',
      '- 關鍵點九',
      '- 關鍵點十',
      '- 關鍵點十一'
    ])

    expect(outline).toContain('建立核心判斷')
    expect(outline).toContain('總結第一句。 總結第二句。')
    expect(outline).toContain('關鍵點十')
    expect(outline).not.toContain('關鍵點十一')
    expect(outline.length).toBeLessThanOrEqual(520)
  })
})
