import { describe, expect, it } from 'vitest'
import {
  detectStageFallback,
  resolveRequestedStage
} from '../../../src/main/thinking/stage-manager'

const COMPLETE_THINKING_MD = `# Thinking Brief

## Topic
2026 AI模型的進化

## Page 1: 封面
- Role: cover
- Objective: 建立主題

介紹主題和分享背景。

- 主題定位
- 受衆價值

## Page 2: 技術演進
- Role: content
- Objective: 說明關鍵趨勢

梳理核心技術變化和工程影響。

- 架構趨勢
- 部署趨勢
`

describe('thinking stage manager', () => {
  it('treats Chinese detail-improvement requests as draft expansion intent', () => {
    expect(detectStageFallback('完善一下細節吧')).toBe('draft')
    expect(detectStageFallback('再補充一些細節')).toBe('draft')
    expect(detectStageFallback('把內容豐富一下')).toBe('draft')
  })

  it('allows outline to move to draft when a complete page plan exists', () => {
    expect(
      resolveRequestedStage({
        currentStage: 'outline',
        requestedStage: 'draft',
        thinkingMd: COMPLETE_THINKING_MD
      })
    ).toBe('draft')
  })
})
