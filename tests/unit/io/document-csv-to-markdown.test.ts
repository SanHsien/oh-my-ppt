import { describe, expect, it } from 'vitest'

import { convertCsvTextToMarkdown } from '../../../src/main/io/document-csv-to-markdown'
import {
  deriveOutlinePageCandidates,
  scanDocumentOutline
} from '../../../src/main/io/document-outline-scan'

describe('document CSV to Markdown conversion', () => {
  it('converts grouped CSV files into heading-backed markdown tables', () => {
    const markdown = convertCsvTextToMarkdown(
      [
        '部門,季度,收入,負責人',
        '銷售,Q1,120,張三',
        '銷售,Q2,150,張三',
        '市場,Q1,80,李四',
        '市場,Q2,90,李四'
      ].join('\n'),
      { title: '季度收入' }
    )
    const scan = scanDocumentOutline(markdown)
    const candidates = deriveOutlinePageCandidates(scan)

    expect(markdown).toContain('# 季度收入')
    expect(markdown).toContain('- 字段：部門、季度、收入、負責人')
    expect(markdown).toContain('## 按部門拆分')
    expect(markdown).toContain('### 銷售')
    expect(markdown).not.toContain('CSV Table')
    expect(markdown).not.toContain('Grouped by')
    expect(markdown).toContain('| 部門 | 季度 | 收入 | 負責人 |')
    expect(scan.headingCount).toBe(4)
    expect(candidates.map((candidate) => candidate.sourceHeading)).toEqual([
      '## 按部門拆分',
      '### 銷售',
      '### 市場'
    ])
    expect(candidates[0].reason).toContain('銷售、市場')
  })

  it('keeps ungrouped CSV files as a markdown table section', () => {
    const markdown = convertCsvTextToMarkdown(
      ['日期,指標,數值', '2026-01-01,DAU,100', '2026-01-02,DAU,105'].join('\n'),
      { title: 'daily metrics.csv' }
    )
    const scan = scanDocumentOutline(markdown)
    const candidates = deriveOutlinePageCandidates(scan)

    expect(markdown).toContain('# daily metrics.csv')
    expect(markdown).toContain('## 日期、指標、數值')
    expect(markdown).not.toContain('CSV Table')
    expect(markdown).toContain('| 日期 | 指標 | 數值 |')
    expect(candidates.map((candidate) => candidate.sourceHeading)).toEqual(['## 日期、指標、數值'])
  })

  it('infers grouping from repeated values instead of hardcoded header names', () => {
    const markdown = convertCsvTextToMarkdown(
      [
        '業務線,客戶,金額',
        '新能源,A 公司,120',
        '新能源,B 公司,130',
        '售後,C 公司,80',
        '售後,D 公司,90'
      ].join('\n'),
      { title: '客戶收入' }
    )
    const scan = scanDocumentOutline(markdown)
    const candidates = deriveOutlinePageCandidates(scan)

    expect(markdown).toContain('## 按業務線拆分')
    expect(markdown).toContain('### 新能源')
    expect(markdown).toContain('### 售後')
    expect(candidates.map((candidate) => candidate.sourceHeading)).toEqual([
      '## 按業務線拆分',
      '### 新能源',
      '### 售後'
    ])
    expect(candidates[0].reason).toContain('新能源、售後')
  })

  it('preserves quoted commas and markdown table pipes safely', () => {
    const markdown = convertCsvTextToMarkdown(
      ['部門,說明', '銷售,"包含,逗號"', '市場,"A|B 測試"'].join('\n'),
      { title: 'quoted values' }
    )

    expect(markdown).toContain('| 銷售 | 包含,逗號 |')
    expect(markdown).toContain('| 市場 | A\\|B 測試 |')
  })
})
