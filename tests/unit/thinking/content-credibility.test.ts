import { describe, expect, it } from 'vitest'
import { findUnsupportedPrecisionClaims } from '../../../src/main/thinking/content-credibility'

describe('thinking content credibility', () => {
  it('flags unsupported exact metrics when no sources exist', () => {
    const issues = findUnsupportedPrecisionClaims({
      hasSources: false,
      markdown: [
        '# Thinking Brief',
        '',
        '## Page 1: 性能躍遷',
        '- Role: data',
        '- Objective: 說明性能變化',
        '',
        '- 單token推理成本下降70%',
        '- HumanEval基準從67%提升至89%',
        '- 工程側應關注推理效率和部署複雜度'
      ].join('\n')
    })

    expect(issues).toHaveLength(2)
    expect(issues.map((issue) => issue.text)).toEqual([
      '- 單token推理成本下降70%',
      '- HumanEval基準從67%提升至89%'
    ])
  })

  it('allows structural numbers and sourced exact metrics', () => {
    expect(
      findUnsupportedPrecisionClaims({
        hasSources: false,
        markdown: [
          '# Thinking Brief',
          '',
          '## Topic',
          '2026 AI模型的進化',
          '',
          '## Setting',
          '技術分享會，時長約10分鐘',
          '',
          '## Page Count',
          '9'
        ].join('\n')
      })
    ).toHaveLength(0)

    expect(
      findUnsupportedPrecisionClaims({
        hasSources: true,
        markdown: '- 單token推理成本下降70%'
      })
    ).toHaveLength(0)
  })
})
