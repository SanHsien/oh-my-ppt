import { describe, expect, it } from 'vitest'
import { buildLocalCompletedGenerationPageSummary } from '../../../src/main/generation/generation-summary'

describe('generation summary', () => {
  it('builds a deterministic Chinese summary from the validated page title', () => {
    expect(
      buildLocalCompletedGenerationPageSummary({
        appLocale: 'zh',
        pageTitle: '區域出生率差異'
      })
    ).toBe('已完成《區域出生率差異》頁面生成')
  })

  it('builds a deterministic English summary from the validated page title', () => {
    expect(
      buildLocalCompletedGenerationPageSummary({
        appLocale: 'en',
        pageTitle: 'Regional birth rate differences'
      })
    ).toBe('Completed page "Regional birth rate differences" generation')
  })
})
