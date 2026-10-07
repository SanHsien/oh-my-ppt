import { describe, expect, it } from 'vitest'
import {
  MAX_KEY_POINTS_PER_SLIDE,
  normalizeKeyPoints,
  normalizeOutlineText
} from '../../../src/main/generation/outline-normalizer'

describe('outline normalizer', () => {
  it('preserves explicit one-slide topic lists beyond four items', () => {
    const outline = normalizeOutlineText(
      '一些名詞、安全風險、AI 使用場景、用好AI的方法、個人場景分享、待辦事項、設計方向'
    )

    expect(outline).toBe(
      '一些名詞；安全風險；AI 使用場景；用好AI的方法；個人場景分享；待辦事項；設計方向'
    )
  })

  it('keeps up to ten key points for a dense single slide plan', () => {
    const points = [
      '一些名詞',
      '安全風險',
      'AI 使用場景',
      '用好AI的方法',
      '個人場景分享',
      '待辦事項',
      '設計方向',
      '結尾互動',
      '備用主題',
      '案例延展',
      '超出上限'
    ]

    expect(normalizeKeyPoints(points)).toEqual(points.slice(0, MAX_KEY_POINTS_PER_SLIDE))
  })
})
