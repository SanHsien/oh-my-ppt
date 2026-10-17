import { describe, expect, it } from 'vitest'
import { AGENT_MIN_OUTPUT_TOKENS, resolveAgentOutputBudget } from '../../../src/main/agent-runtime/model/output-budget'

// 回歸背景：網關推理型模型在工具調用前流式輸出 reasoning_content，且可能忽略
// thinking 禁用參數。4096 輸出預算會在思考階段耗盡（finish_reason=length），
// update_*_page_file 工具調用從未發出，頁面生成全部以「頁面未寫入」失敗。
// agent 鏈路（deck 生成 / 整頁與 deck 編輯 / selector 編輯）的輸出預算因此
// 必須有 16384 下限。

describe('resolveAgentOutputBudget', () => {
  it('raises small configured budgets to the agent minimum', () => {
    expect(resolveAgentOutputBudget(4096)).toBe(AGENT_MIN_OUTPUT_TOKENS)
    expect(AGENT_MIN_OUTPUT_TOKENS).toBe(16384)
  })

  it('keeps budgets already at or above the minimum', () => {
    expect(resolveAgentOutputBudget(16384)).toBe(16384)
    expect(resolveAgentOutputBudget(32768)).toBe(32768)
  })

  it('falls back to the minimum for unset or invalid values', () => {
    expect(resolveAgentOutputBudget(undefined)).toBe(AGENT_MIN_OUTPUT_TOKENS)
    expect(resolveAgentOutputBudget(0)).toBe(AGENT_MIN_OUTPUT_TOKENS)
    expect(resolveAgentOutputBudget(-1)).toBe(AGENT_MIN_OUTPUT_TOKENS)
  })
})
