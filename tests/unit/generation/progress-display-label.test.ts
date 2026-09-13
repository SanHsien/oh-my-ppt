import { describe, expect, it } from 'vitest'
import { progressDisplayLabel } from '../../../src/shared/progress'

describe('progressDisplayLabel', () => {
  it('preserves page-specific completion labels', () => {
    expect(progressDisplayLabel('zh', 'P3 編輯完成')).toBe('P3 編輯完成')
    expect(progressDisplayLabel('zh', 'P3 當前步驟完成，正在校驗頁面')).toBe(
      'P3 當前步驟完成，正在校驗頁面'
    )
    expect(progressDisplayLabel('zh', '第 3 頁重試成功')).toBe('第 3 頁重試成功')
  })

  it('still normalizes generic labels', () => {
    expect(progressDisplayLabel('zh', '已完成')).toBe('已完成')
    expect(progressDisplayLabel('zh', '正在改寫頁面')).toBe('生成頁面')
    expect(progressDisplayLabel('en', '正在校驗')).toBe('Checking pages')
  })
})
