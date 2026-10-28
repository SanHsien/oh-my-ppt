import { describe, expect, it } from 'vitest'
import { findUnsupportedPrecisionClaims } from '../../../src/main/thinking/content-credibility'

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
