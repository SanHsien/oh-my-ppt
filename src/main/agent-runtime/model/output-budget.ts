/**
 * 頁面寫入輪次（deck 生成 / 整頁與 deck 編輯 / selector 編輯）的輸出預算下限。
 *
 * 背景：網關推理型模型會在工具調用前流式輸出 reasoning_content，且可能忽略
 * thinking 禁用參數（實測 finish_reason=length 時 reasoning 已耗盡全部預算，
 * update_*_page_file 工具調用從未發出）。頁面片段 + 思考輸出在 4096 預算下
 * 必然截斷，因此 agent 鏈路的輸出預算至少要給到配置允許的上限一檔。
 */
export const AGENT_MIN_OUTPUT_TOKENS = 16384

export function resolveAgentOutputBudget(maxTokens?: number): number {
  const configured = maxTokens && maxTokens > 0 ? Math.floor(maxTokens) : 0
  return Math.max(configured, AGENT_MIN_OUTPUT_TOKENS)
}
