# 深度思考模型 (Thinking Models) 參數配置手冊

針對具備推理能力（Reasoning / Thinking）的模型，可在設定時透過「自訂 JSON 參數」進行微調。

---

## 常見模型參數速查

### 1. DeepSeek R1
DeepSeek R1 會主動輸出推理過程，無需特別開啟參數：
```json
{
  "max_tokens": 8000
}
```

### 2. OpenAI o1 / o3-mini
支援控制推理強度（`low` / `medium` / `high`）：
```json
{
  "reasoning_effort": "medium"
}
```

### 3. Claude 3.7 Sonnet (Thinking)
開啟擴展思維並給予思考預算（tokens）：
```json
{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 4000
  }
}
```

### 4. Google Gemini 2.0 Flash (Thinking)
設定思考預算（0 為關閉思考，1~8192 為自訂預算）：
```json
{
  "thinkingBudget": 4000
}
```

### 5. 本地 Qwen2.5 / 3 (vLLM / SGLang)
若後端支援 `chat_template_kwargs`：
```json
{
  "chat_template_kwargs": {
    "enable_thinking": true
  }
}
```
