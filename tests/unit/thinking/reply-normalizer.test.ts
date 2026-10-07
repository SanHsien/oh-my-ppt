import { describe, expect, it } from 'vitest'
import {
  normalizeThinkingAssistantReply,
  normalizeThinkingMessages
} from '../../../src/main/thinking/reply-normalizer'

describe('thinking reply normalizer', () => {
  it('keeps ordinary user-facing replies', () => {
    expect(normalizeThinkingAssistantReply(' 我已確認主題，可以繼續規劃。 ')).toBe(
      '我已確認主題，可以繼續規劃。'
    )
  })

  it('drops workflow tool return text', () => {
    expect(normalizeThinkingAssistantReply('context.md updated for stage collect.')).toBe('')
    expect(normalizeThinkingAssistantReply('thinking.md updated')).toBe('')
  })

  it('strips streamed tool argument fragments before the visible reply', () => {
    const raw = [
      '"topic": "2026年AI短劇的發展",',
      '  "userIntent": "用戶希望創建演示文稿",',
      '  "confirmedDecisions": ["主題確定"],',
      '}',
      '',
      '我已確認您的演示主題爲**2026年AI短劇的發展**。'
    ].join('\n')

    expect(normalizeThinkingAssistantReply(raw)).toBe(
      '我已確認您的演示主題爲**2026年AI短劇的發展**。'
    )
  })

  it('normalizes persisted message arrays without changing user messages', () => {
    const messages = normalizeThinkingMessages([
      { role: 'user', content: '影視從業者，內部研討' },
      { role: 'assistant', content: 'context.md updated for stage collect.' },
      {
        role: 'assistant',
        content: '"topic": "AI短劇",\n  "userIntent": "規劃演示"\n}\n\n可以開始規劃。'
      }
    ])

    expect(messages).toEqual([
      { role: 'user', content: '影視從業者，內部研討' },
      { role: 'assistant', content: '可以開始規劃。' }
    ])
  })
})
