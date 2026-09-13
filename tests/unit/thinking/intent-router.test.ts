import { describe, expect, it } from 'vitest'
import { routeThinkingIntent } from '../../../src/main/thinking/intent-router'

describe('thinking intent router', () => {
  it('routes detail expansion to draft intent', () => {
    const route = routeThinkingIntent({
      currentStage: 'outline',
      userMessage: '完善一下細節吧'
    })

    expect(route.intent).toBe('expand_draft')
    expect(route.requestedStage).toBe('draft')
    expect(route.confidence).toBe('high')
  })

  it('routes outline planning requests from collect', () => {
    const route = routeThinkingIntent({
      currentStage: 'collect',
      userMessage: '需要設計'
    })

    expect(route.intent).toBe('plan_outline')
    expect(route.requestedStage).toBe('outline')
  })

  it('does not force a transition for ordinary requirement collection', () => {
    const route = routeThinkingIntent({
      currentStage: 'collect',
      userMessage: '技術從業者 分享會，大致10分鐘'
    })

    expect(route.intent).toBe('collect_info')
    expect(route.requestedStage).toBeNull()
  })
})
