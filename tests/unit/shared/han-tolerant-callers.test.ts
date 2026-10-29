import { describe, expect, it } from 'vitest'
import { findUnsupportedPrecisionClaims } from '../../../src/main/thinking/content-credibility'
import { buildThinkingSourcePlan } from '../../../src/main/thinking/source-plan'
import { extractOutlineTitles } from '../../../src/main/ipc/utils'
import { scanDocumentOutline } from '../../../src/main/io/document-outline-scan'
import { normalizeProgressLabel, progressDisplayLabel } from '../../../src/shared/progress'
import { normalizeGeneratedImagePrompt } from '../../../src/main/image-generation/prompt-director'
import { extractStructuredTokens } from '../../../src/main/generation/reference-document-retrieval'
import { isSpeechSectionForPage, upsertSpeechSection } from '../../../src/main/speech/handlers'

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

describe('image prompt director output', () => {
  it('drops a Simplified 提示词 prefix like 提示詞', () => {
    expect(normalizeGeneratedImagePrompt('提示詞：一隻貓')).toBe('一隻貓')
    expect(normalizeGeneratedImagePrompt('提示词：一只猫')).toBe('一只猫')
  })
})

describe('reference document retrieval reads Simplified numbers and units', () => {
  it('extracts Simplified 亿元 and 万元 tokens like their Traditional twins', () => {
    expect(extractStructuredTokens('營業額達到 3.5亿元，同比增長 10%')).toContain('3.5亿元')
    expect(extractStructuredTokens('營業額達到 3.5億元，同比增長 10%')).toContain('3.5億元')
    expect(extractStructuredTokens('淨利潤 2.8万元')).toContain('2.8万元')
    expect(extractStructuredTokens('淨利潤 2.8萬元')).toContain('2.8萬元')
  })
})

describe('speech handlers read Simplified speech script headings', () => {
  it('matches a Simplified 第 3 页 heading for the current page', () => {
    const section = '## 第 3 页: 市場概況\n\n這裡是講稿內容'
    expect(isSpeechSectionForPage(section, 3, '')).toBe(true)
    expect(isSpeechSectionForPage(section, 3, '市場概況')).toBe(true)
  })

  it('upserts and sorts a script containing Simplified 第 N 页 headings', () => {
    const existing = [
      '## 第 1 页: 開場\n\n內容 1',
      '## 第 3 页: 深入分析\n\n舊內容 3'
    ].join('\n\n---\n\n')

    const updated = upsertSpeechSection(existing, 3, '深入分析', '## Slide 3: 深入分析\n\n新內容 3')
    expect(updated).not.toContain('舊內容 3')
    expect(updated).toContain('新內容 3')

    const withPage2 = upsertSpeechSection(existing, 2, '過渡', '## Slide 2: 過渡\n\n內容 2')
    const sections = withPage2.split(/\n\s*---\s*\n/g)
    expect(sections).toHaveLength(3)
    expect(sections[0]).toContain('第 1 页')
    expect(sections[1]).toContain('Slide 2')
    expect(sections[2]).toContain('第 3 页')
  })
})
