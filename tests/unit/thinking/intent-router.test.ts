import { describe, expect, it } from 'vitest'
import { routeThinkingIntent } from '../../../src/main/thinking/intent-router'
import { isRestartRequest } from '../../../src/main/thinking/stage-manager'

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

  // The Traditional conversion kept only one spelling per pattern; people type Simplified too.
  it.each([
    ['重新开始', 'restart'],
    ['從頭開始', 'restart'],
    ['从头开始', 'restart'],
    ['确认生成', 'confirm_ready'],
    ['開始生成', 'confirm_ready'],
    ['开始生成', 'confirm_ready'],
    ['就按这个', 'confirm_ready'],
    ['详细展开一下', 'expand_draft'],
    ['展开细化', 'expand_draft'],
    ['润色一下', 'refine'],
    ['调整一下细节', 'refine'],
    ['出大纲', 'plan_outline'],
    ['规划一下', 'plan_outline'],
    ['拆页', 'plan_outline']
  ])('routes %s to %s in either script', (userMessage, intent) => {
    expect(routeThinkingIntent({ currentStage: 'collect', userMessage }).intent).toBe(intent)
  })

  it.each(['重新开始', '從頭開始', '从头开始', "let's start over"])(
    'treats %s as a restart request',
    (message) => {
      expect(isRestartRequest(message)).toBe(true)
    }
  )

  it('does not treat ordinary collection text as a restart request', () => {
    expect(isRestartRequest('技术从业者 分享会')).toBe(false)
  })
})
