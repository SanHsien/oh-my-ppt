import { describe, expect, it } from 'vitest'
import { findUnsupportedPrecisionClaims } from '../../../src/main/thinking/content-credibility'
import { buildThinkingSourcePlan } from '../../../src/main/thinking/source-plan'
import { extractOutlineTitles } from '../../../src/main/ipc/utils'
import { scanDocumentOutline } from '../../../src/main/io/document-outline-scan'
import { normalizeProgressLabel, progressDisplayLabel } from '../../../src/shared/progress'

// Text that people and models write comes in Simplified as often as in Traditional, and Taiwan-standard
// Traditional (啟, 為, 眾) differs from the variant glyphs the source tree was converted to (啓, 爲, 衆).
// Each case below states one input in Simplified (or Taiwan-standard) and expects what its Traditional
// twin already gets. See src/shared/han-variants.ts.
describe('content credibility reads Simplified metric claims', () => {
  it('flags an unsupported Simplified metric like its Traditional twin', () => {
    const run = (line: string) =>
      findUnsupportedPrecisionClaims({ hasSources: false, markdown: ['## Page 1: 效果', line].join('\n') })
    expect(run('- 準確率提升到95%')).toHaveLength(1)
    expect(run('- 准确率提升到95%')).toHaveLength(1)
    expect(run('- 成本节省 3 万元')).toHaveLength(1)
  })
})

describe('thinking source plan reads Simplified page roles', () => {
  it('treats a Simplified chapter page as a chapter divider', () => {
    const plan = (role: string) =>
      buildThinkingSourcePlan(
        ['# Thinking Brief', '## Topic', '方案', '', '## Page 1: 第一部分', `- Role: ${role}`, '', '正文'].join('\n'),
        '/tmp/thinking.md'
      )?.pageSkeleton[0]
    expect(plan('章節過渡')).toMatchObject({ role: 'chapter-divider' })
    expect(plan('章节过渡')).toMatchObject({ role: 'chapter-divider' })
    expect(plan('标题页')).toMatchObject({ role: 'chapter-divider' })
  })
})

describe('outline titles from a user message', () => {
  it('reads Simplified 第N页 lines', () => {
    expect(extractOutlineTitles('第1頁：市場概況\n第2頁：競品')).toEqual(['市場概況', '競品'])
    expect(extractOutlineTitles('第1页：市场概况\n第二页：竞品')).toEqual(['市场概况', '竞品'])
  })
})

describe('document outline scan reads Simplified unit titles', () => {
  it('suggests a short Simplified 复盘 section as a standalone slide like 覆盤', () => {
    const hints = (unit: string) =>
      scanDocumentOutline(['# 報告', '', '## 第一章', '內容', '', `### ${unit}`, '一句話。', '', '## 第二章', '內容'].join('\n'))
        .recommendedSplitHints.join('\n')
    expect(hints('項目覆盤')).toContain('### 項目覆盤')
    expect(hints('项目复盘')).toContain('### 项目复盘')
    expect(hints('其他雜談')).not.toContain('### 其他雜談')
  })
})

describe('progress labels from agent status', () => {
  it('maps Simplified status labels like their Traditional twins', () => {
    expect(normalizeProgressLabel('檢查頁面')).toBe('checking')
    expect(normalizeProgressLabel('检查页面')).toBe('checking')
    expect(normalizeProgressLabel('生成失败')).toBe('failed')
    expect(normalizeProgressLabel('已创建')).toBe('completed')
    expect(normalizeProgressLabel('准备画布')).toBe('preparing')
  })

  it('keeps a Simplified 第N页 label as it is', () => {
    expect(progressDisplayLabel('zh', '第 3 頁重試成功')).toBe('第 3 頁重試成功')
    expect(progressDisplayLabel('zh', '第 3 页重试成功')).toBe('第 3 页重试成功')
  })
})
