import { describe, expect, it } from 'vitest'
import {
  canUseSourcePlanDirectly,
  mapSourcePlanToOutlineItems,
  sourcePlanFromSkeletonRows
} from '../../../src/main/generation/source-plan'

describe('source page skeleton planning', () => {
  it('normalizes database rows into a source plan', () => {
    const sourcePlan = sourcePlanFromSkeletonRows([
      {
        page_number: 1,
        title: '第一篇：認知篇',
        role: 'chapter-divider',
        source_document_path: '/docs/source.md',
        source_document_name: 'source.md',
        source_heading: '# 第一篇：認知篇',
        heading_level: 1,
        line_start: 10,
        line_end: 28,
        reason: 'major # heading after the topic',
        confidence: 'high'
      }
    ])

    expect(sourcePlan).toMatchObject({
      confidence: 'high',
      sourceDocumentPath: '/docs/source.md',
      pageSkeleton: [
        {
          pageNumber: 1,
          title: '第一篇：認知篇',
          role: 'chapter-divider',
          sourceHeading: '# 第一篇：認知篇',
          lineStart: 10,
          lineEnd: 28,
          reason: ''
        }
      ]
    })
  })

  it('uses only high-confidence matching skeletons without restructure requests', () => {
    const sourcePlan = sourcePlanFromSkeletonRows([
      {
        page_number: 1,
        title: 'Market',
        role: 'content',
        source_document_path: '/docs/source.md',
        source_heading: '## Market',
        heading_level: 2,
        line_start: 3,
        line_end: 20,
        confidence: 'high'
      }
    ])

    expect(canUseSourcePlanDirectly({ sourcePlan, totalPages: 1, userMessage: '按文檔生成' })).toBe(true)
    expect(canUseSourcePlanDirectly({ sourcePlan, totalPages: 2, userMessage: '按文檔生成' })).toBe(false)
    expect(canUseSourcePlanDirectly({ sourcePlan, totalPages: 1, userMessage: '壓縮成 1 頁' })).toBe(false)
  })

  it('maps skeleton rows into range-bound outline items', () => {
    const sourcePlan = sourcePlanFromSkeletonRows([
      {
        page_number: 1,
        title: '收入增長',
        role: 'content',
        source_document_path: '/docs/source.md',
        source_heading: '## 收入增長',
        heading_level: 2,
        line_start: 30,
        line_end: 48,
        reason: 'leaf ## section without standalone child sections',
        confidence: 'high'
      }
    ])
    expect(sourcePlan).not.toBeNull()

    const [item] = mapSourcePlanToOutlineItems(sourcePlan!)

    expect(item).toMatchObject({
      title: '收入增長',
      layoutIntent: 'data-focus'
    })
    expect(item.contentOutline).toContain('Source heading: ## 收入增長')
    expect(item.contentOutline).toContain('Source range: lines 30-48')
    expect(item.contentOutline).not.toContain('Page purpose:')
    expect(item.contentOutline).not.toContain('leaf ## section')
  })

  it('maps section agenda rows with chapter context source headings and ranges', () => {
    const sourcePlan = sourcePlanFromSkeletonRows([
      {
        page_number: 1,
        title: '二、技術參數與技術效率明細',
        role: 'content',
        source_document_path: '/docs/source.md',
        source_heading: '## 二、技術參數與技術效率明細',
        heading_level: 2,
        line_start: 18,
        line_end: 19,
        reason:
          '章節目錄頁：概覽本章下的子主題，包括：2.1 主流AI動漫工具性能對比、2.2 訓練數據規模、2.3 效率實證。',
        confidence: 'high'
      }
    ])
    expect(sourcePlan).not.toBeNull()

    const [item] = mapSourcePlanToOutlineItems(sourcePlan!)

    expect(item).toMatchObject({
      title: '二、技術參數與技術效率明細',
      layoutIntent: 'summary'
    })
    expect(item.contentOutline).toContain('Page role: section-agenda')
    expect(item.contentOutline).toContain('2.1 主流AI動漫工具性能對比')
    expect(item.contentOutline).toContain('Source heading: ## 二、技術參數與技術效率明細')
    expect(item.contentOutline).toContain('Source range: lines 18-19')
  })
})
