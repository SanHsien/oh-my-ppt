# AI 模型與生圖服務配置手冊

Oh My PPT 採用自由解耦架構，支援將**文字大綱創作**與**AI 繪圖/配圖**分開配置至不同服務商。

---

## 文字生成模型配置 (Text Models)

### 1. OpenAI 官方 / 相容介面
- **Provider**：`openai`
- **Base URL**：`https://api.openai.com/v1`（若使用中轉服務請替換為中轉網址）
- **Model**：`gpt-4o`、`gpt-4o-mini`、`o1`、`o3-mini`
- **API Key**：填入 `sk-...`

### 2. Anthropic Claude
- **Provider**：`anthropic`
- **Base URL**：`https://api.anthropic.com/v1`
- **Model**：`claude-3-7-sonnet-20250219`、`claude-3-5-haiku-20241022`
- **API Key**：填入 `sk-ant-...`

### 3. Google Gemini
- **Provider**：`gemini`
- **Model**：`gemini-2.0-flash`、`gemini-1.5-pro`
- **API Key**：填入 Google AI Studio 取得之 API Key

### 4. DeepSeek
- **Provider**：`openai`（使用 OpenAI 相容協議）
- **Base URL**：`https://api.deepseek.com/v1`
- **Model**：`deepseek-chat` (V3) 或 `deepseek-reasoner` (R1)
- **API Key**：填入 DeepSeek 開放平台金鑰
- *注意*：DeepSeek 純文字模型不具備多模態識圖能力，若需上傳圖片解析大綱，請搭配支援視覺的模型。

### 5. 通義千問 (Aliyun DashScope)
- **Provider**：`openai`
- **Base URL**：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- **Model**：`qwen-plus`、`qwen-max`、`qwen2.5-coder-32b-instruct`

---

## AI 生圖模型配置 (Image Generation Models)

在「設定 → 生圖模型」中配置圖片生成模型。系統提供以下 Provider 選項：

| Provider | 說明 | 推薦模型 | 備註 |
|---|---|---|---|
| **openai** | OpenAI 官方或相容圖片介面 | `dall-e-3` | 支援 1024x1024 / 1792x1024 |
| **siliconflow** | 矽基流動圖片 API | `black-forest-labs/FLUX.1-schnell` | 高性價比、生成速度極快 |
| **gemini** | Google 官方生圖介面 | `imagen-3.0-generate-002` | 需開通 Google 生圖權限 |
| **jimeng** | 即夢 AI (字節跳動) | `jimeng-3.0` / `jimeng-4.0` | 中文提示詞理解極佳 |
| **seedream** | Seedream 引擎 | 內建預設 | 適合藝術繪本風格 |

> **驗證提示**：生圖模型新增後，必須點擊「驗證」，系統會以預設解析度發起一次微型測試出圖，確認回傳成功後方可儲存。
