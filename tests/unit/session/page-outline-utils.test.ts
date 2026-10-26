import { describe, expect, it } from 'vitest'
import {
  migrateLegacyPageOutlinesToSourceSkeletons,
  resolveOutlinesForPages,
  resolvePageContentOutline
} from '../../../src/main/session/page-outline-utils'
import type {
  GenerationPageRecord,
  PPTDatabase,
  Session,
  SessionPageRecord,
  SourcePageSkeletonRecord
} from '../../../src/main/db/database'

const makeSnapshot = (
  pageId: string,
  pageNumber: number,
  contentOutline: string
): GenerationPageRecord => ({
  id: `run:${pageId}`,
  run_id: 'run',
  session_id: 'session',
  page_id: pageId,
  page_number: pageNumber,
  title: `P${pageNumber}`,
  content_outline: contentOutline,
  layout_intent: null,
  html_path: null,
  status: 'completed',
  error: null,
  retry_count: 0,
  created_at: 1,
  updated_at: 1
})

const makeSessionPage = (
  id: string,
  fileSlug: string,
  pageNumber: number
): Pick<SessionPageRecord, 'id' | 'file_slug' | 'legacy_page_id' | 'page_number'> => ({
  id,
  file_slug: fileSlug,
  legacy_page_id: null,
  page_number: pageNumber
})

const makeSourceSkeleton = (
  pageNumber: number,
  sourceHeading: string,
  reason: string | null = null
): SourcePageSkeletonRecord => ({
  id: `session:${pageNumber}`,
  session_id: 'session',
  page_number: pageNumber,
  title: `P${pageNumber}`,
  role: 'content',
  source_document_path: '/source.md',
  source_document_name: 'source.md',
  source_heading: sourceHeading,
  heading_level: 1,
  line_start: pageNumber,
  line_end: pageNumber,
  reason,
  confidence: 'high',
  created_at: 1,
  updated_at: 1
})

describe('resolvePageContentOutline', () => {
  it('extracts explicit Chinese page sections', () => {
    const outline = [
      '第 1 頁：項目背景',
      '- 市場變化',
      '第 2 頁：方案策略',
      '- 分階段落地',
      '- 明確負責人',
      '第 3 頁：總結'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe('方案策略 分階段落地 明確負責人')
  })

  it('extracts explicit English page sections without leaking the page number', () => {
    const outline = ['Page 1: Context', 'Page 2', '- Delivery plan', '- Owner mapping'].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe('Delivery plan Owner mapping')
  })

  it('extracts Chinese markdown page sections from the new thinking outline format', () => {
    const outline = [
      '## 第 1 頁：封面',
      '- 頁面角色：封面',
      '- 頁面目的：建立主題',
      '',
      '用一句話說明彙報對象。',
      '- 項目名稱',
      '- 彙報日期',
      '',
      '## 第 2 頁：技術演進',
      '- Role: content',
      '- Objective: 說明關鍵趨勢',
      '',
      '梳理核心技術變化和工程影響。',
      '- 架構趨勢',
      '- 部署趨勢'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe(
      '技術演進 說明關鍵趨勢 梳理核心技術變化和工程影響。 架構趨勢 部署趨勢'
    )
  })

  it('stops explicit page extraction before following global brief sections', () => {
    const outline = [
      '每頁要點：',
      '第 1 頁：背景與目標',
      '頁面角色：內容頁',
      '頁面目的：解釋項目背景',
      '必須保留：',
      '- 預算數字',
      '風格：',
      '- 剋制'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 1)).toBe('背景與目標 解釋項目背景')
  })

  it('extracts numbered items inside an outline section', () => {
    const outline = [
      '推薦大綱',
      '1. 封面：一句話說明主題',
      '2. 現狀分析：痛點、數據、機會',
      '   - 補充關鍵指標',
      '3. 行動計劃：節奏和責任'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe('現狀分析：痛點、數據、機會 補充關鍵指標')
  })

  it('does not split ordinary per-page numbered bullets by default', () => {
    const outline = ['1. 保留核心指標', '2. 加一張趨勢圖', '3. 結尾突出風險'].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe(
      '1. 保留核心指標 2. 加一張趨勢圖 3. 結尾突出風險'
    )
  })

  it('can split a shared unheaded numbered deck outline', () => {
    const outline = ['1. 背景與目標', '2. 方案設計', '3. 里程碑'].join('\n')

    expect(resolvePageContentOutline(outline, 2, { allowUnheadedNumberedOutline: true })).toBe(
      '方案設計'
    )
  })
})

describe('resolvePageContentOutline with Simplified outlines', () => {
  // Outlines come from the user's own reference documents and from older sessions, which are
  // frequently Simplified. The Traditional conversion collapsed [页頁] into [頁頁].
  it('extracts explicit Simplified page sections', () => {
    const outline = [
      '第 1 页：项目背景',
      '- 市场变化',
      '第 2 页：方案策略',
      '- 分阶段落地',
      '- 明确负责人',
      '第 3 页：总结'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe('方案策略 分阶段落地 明确负责人')
  })

  it('reads Chinese numerals and the 页面 / 幻灯片 heading forms', () => {
    expect(resolvePageContentOutline(['第两页：方案', '- 要点甲', '第三页：收尾'].join('\n'), 2)).toBe(
      '方案 要点甲'
    )
    expect(resolvePageContentOutline(['页面 1：背景', '页面 2：方案', '- 要点乙'].join('\n'), 2)).toBe(
      '方案 要点乙'
    )
    expect(resolvePageContentOutline(['幻灯片 1 背景', '幻灯片 2 方案', '- 要点丙'].join('\n'), 2)).toBe(
      '方案 要点丙'
    )
    expect(resolvePageContentOutline(['1. 幻灯片 背景', '2. 幻灯片 方案', '- 要点丁'].join('\n'), 2)).toBe(
      '方案 要点丁'
    )
  })

  it('stops a Simplified page entry before the following global brief sections', () => {
    const outline = [
      '每页要点：',
      '第 1 页：背景与目标',
      '页面角色：内容页',
      '页面目的：解释项目背景',
      '必须保留：',
      '- 预算数字',
      '风格：',
      '- 克制'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 1)).toBe('背景与目标 解释项目背景')
  })

  it('extracts numbered items inside a Simplified outline section', () => {
    const outline = [
      '推荐大纲',
      '1. 封面：一句话说明主题',
      '2. 现状分析：痛点、数据、机会',
      '   - 补充关键指标',
      '3. 行动计划：节奏和责任'
    ].join('\n')

    expect(resolvePageContentOutline(outline, 2)).toBe('现状分析：痛点、数据、机会 补充关键指标')
  })
})

describe('resolveOutlinesForPages', () => {
  it('uses source page skeletons as the page outline source', async () => {
    const db = {
      listSourcePageSkeletons: async () => [
        makeSourceSkeleton(1, '背景與目標'),
        makeSourceSkeleton(2, '方案設計', '明確交付節奏'),
        makeSourceSkeleton(3, '里程碑')
      ]
    } as Pick<PPTDatabase, 'listSourcePageSkeletons'> as PPTDatabase

    const result = await resolveOutlinesForPages(db, 'session', [
      makeSessionPage('session-a', 'page-a', 1),
      makeSessionPage('session-b', 'page-b', 2),
      makeSessionPage('session-c', 'page-c', 3)
    ])

    expect(result.get('session-a')).toBe('背景與目標')
    expect(result.get('session-b')).toBe('方案設計 明確交付節奏')
    expect(result.get('session-c')).toBe('里程碑')
  })
})

describe('migrateLegacyPageOutlinesToSourceSkeletons', () => {
  it('migrates shared generation outlines into source page skeleton rows', async () => {
    const deckOutline = ['1. 背景與目標', '2. 方案設計', '3. 里程碑'].join('\n')
    const replaced: Parameters<PPTDatabase['replaceSourcePageSkeletons']>[0][] = []
    const db = {
      listSourcePageSkeletons: async () => [],
      getSession: async () =>
        ({
          id: 'session',
          title: '遷移測試',
          reference_document_path: '/docs/source.md',
          referenceDocumentPath: '/docs/source.md'
        }) as Session,
      listSessionPages: async () => [
        makeSessionPage('session-a', 'page-a', 1) as SessionPageRecord,
        makeSessionPage('session-b', 'page-b', 2) as SessionPageRecord,
        makeSessionPage('session-c', 'page-c', 3) as SessionPageRecord
      ],
      listLatestGenerationPageSnapshot: async () => [
        makeSnapshot('page-a', 1, deckOutline),
        makeSnapshot('page-b', 2, deckOutline),
        makeSnapshot('page-c', 3, deckOutline)
      ],
      replaceSourcePageSkeletons: async (args) => {
        replaced.push(args)
      }
    } as Pick<
      PPTDatabase,
      | 'listSourcePageSkeletons'
      | 'getSession'
      | 'listSessionPages'
      | 'listLatestGenerationPageSnapshot'
      | 'replaceSourcePageSkeletons'
    > as PPTDatabase

    const result = await migrateLegacyPageOutlinesToSourceSkeletons(db, 'session')

    expect(result).toEqual({ migrated: true, migratedCount: 3, existingCount: 0 })
    expect(replaced[0]?.sourceDocumentPath).toBe('/docs/source.md')
    expect(replaced[0]?.items.map((item) => item.sourceHeading)).toEqual([
      '背景與目標',
      '方案設計',
      '里程碑'
    ])
  })

  it('reads legacy outline metadata written with Simplified labels', async () => {
    const replaced: Parameters<PPTDatabase['replaceSourcePageSkeletons']>[0][] = []
    const legacy = ['来源标题：方案设计', '结构依据：文档二级标题', '页面角色：章节分隔'].join('\n')
    const db = {
      listSourcePageSkeletons: async () => [],
      getSession: async () => ({ id: 'session', title: '迁移测试' }) as Session,
      listSessionPages: async () => [makeSessionPage('session-a', 'page-a', 1) as SessionPageRecord],
      listLatestGenerationPageSnapshot: async () => [makeSnapshot('page-a', 1, legacy)],
      replaceSourcePageSkeletons: async (args) => {
        replaced.push(args)
      }
    } as Pick<
      PPTDatabase,
      | 'listSourcePageSkeletons'
      | 'getSession'
      | 'listSessionPages'
      | 'listLatestGenerationPageSnapshot'
      | 'replaceSourcePageSkeletons'
    > as PPTDatabase

    await migrateLegacyPageOutlinesToSourceSkeletons(db, 'session')

    expect(replaced[0]?.items[0]).toMatchObject({
      sourceHeading: '方案设计',
      reason: '文档二级标题',
      role: 'chapter-divider'
    })
  })

  it('does not overwrite existing source page skeletons', async () => {
    const db = {
      listSourcePageSkeletons: async () => [makeSourceSkeleton(1, '已有大綱')]
    } as Pick<PPTDatabase, 'listSourcePageSkeletons'> as PPTDatabase

    await expect(migrateLegacyPageOutlinesToSourceSkeletons(db, 'session')).resolves.toEqual({
      migrated: false,
      migratedCount: 0,
      existingCount: 1
    })
  })
})
