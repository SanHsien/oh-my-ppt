# 常見使用問題與疑難排解 (FAQ)

本指南彙整 Oh My PPT Windows 維護版的最常見問題、排查步驟與使用技巧。

---

## 目錄
- [1. 如何下載與安裝？](#1-如何下載與安裝)
- [2. 需要保持聯網嗎？](#2-需要保持聯網嗎)
- [3. 如何配置 AI 模型？](#3-如何配置-ai-模型)
- [4. 推薦使用哪些模型？](#4-推薦使用哪些模型)
- [5. 可以同時配置多個模型嗎？](#5-可以同時配置多個模型嗎)
- [6. 如何使用本地 Ollama 模型？](#6-如何使用本地-ollama-模型)
- [7. 連線超時或驗證失敗怎麼辦？](#7-連線超時或驗證失敗怎麼辦)
- [8. API Key 與商業資料安全嗎？](#8-api-key-與商業資料安全嗎)
- [9. Windows SmartScreen 提示如何處理？](#9-windows-smartscreen-提示如何處理)
- [10. 匯出的 PPTX 可以在微軟 Office 中編輯嗎？](#10-匯出的-pptx-可以在微軟-office-中編輯嗎)

---

### 1. 如何下載與安裝？
從 [SanHsien/oh-my-ppt Releases](https://github.com/SanHsien/oh-my-ppt/releases) 頁面下載最新版檔案：
- **標準安裝版**（`oh-my-ppt-*-setup.exe`）：雙擊啟動安裝精靈，自動建立桌面與開始功能表捷徑。
- **綠色免安裝版**（`oh-my-ppt-*-win-x64-portable.zip`）：解壓縮至任意目錄後，直接執行 `ohmyppt.exe` 即可使用。

### 2. 需要保持聯網嗎？
核心功能完全**本地優先（Local-first）**：
- 簡報會話、素材、頁面結構與歷史紀錄均儲存於本機電腦，無網路亦可離線瀏覽、編輯、播放與匯出。
- AI 生成部分若串接本地運行的 **Ollama** 模型（如 Qwen2.5-Coder、DeepSeek），可達成 100% 離線生成，商業機密零外洩。
- 若使用雲端 API（如 OpenAI、Claude、Gemini），僅在主動發起生成或對話修改時會向對應的服務商端點發出請求。

### 3. 如何配置 AI 模型？
進入「設定 → 文字模型」，點擊「新增配置」：
1. **服務商（Provider）**：選擇對應廠商（如 `openai`、`anthropic`、`gemini` 等）。
2. **Base URL**：若使用相容轉發或本地端點，填寫相應的 URL（如 `http://127.0.0.1:11434/v1`）。
3. **模型名稱（Model）**：填入欲使用的模型識別名稱（如 `gpt-4o`、`claude-3-7-sonnet-20250219`、`qwen2.5-coder:14b`）。
4. **API 金鑰（API Key）**：填入服務商提供的 Key（Ollama 本地部署可填任意非空字串如 `ollama`）。
5. 點擊「驗證」，驗證通過後即可儲存啟用。

### 4. 推薦使用哪些模型？
- **頂級表現與複雜長文**：Claude 3.7 Sonnet、GPT-4o、Gemini 2.0 Flash。
- **高性價比與國內直連**：DeepSeek V3 / R1、通義千問 Qwen2.5-Coder、豆包 Doubao、智譜 GLM-4。
- **純本地無聯網**：Ollama 搭配 `qwen2.5-coder:14b` 或 `qwen2.5-coder:32b`。

### 5. 可以同時配置多個模型嗎？
可以。您可以新增多組模型配置（例如一組雲端強模型、一組本地 Ollama），在模型列表點擊「啟用」即可無縫切換。
文字模型與生圖模型是分開管理的，您可以使用 A 服務商產出文字大綱，同時使用 B 服務商產出配圖。

### 6. 如何使用本地 Ollama 模型？
1. 在本機安裝並啟動 Ollama：`ollama run qwen2.5-coder:14b`。
2. 在 Oh My PPT「設定 → 文字模型」中新增：
   - 協議：`openai`
   - Base URL：`http://127.0.0.1:11434/v1`
   - 模型名稱：`qwen2.5-coder:14b`
   - API Key：`ollama`（任意非空字串）
3. 點擊「驗證」並儲存。

### 7. 連線超時或驗證失敗怎麼辦？
請依序排查：
1. 檢查本機網路連線是否通暢。
2. 檢查 API Key 與 Base URL 是否填寫正確（末尾不要多帶斜線或空白）。
3. 若使用國外 API 端點且身處受限網路環境，請在「設定 → 網路設定」中設定代理伺服器 URL（例如 `http://127.0.0.1:7890`）。
4. 若使用本地 Ollama，請確認終端中 `ollama serve` 正常運行，並可在瀏覽器訪問 `http://127.0.0.1:11434`。

### 8. API Key 與商業資料安全嗎？
所有設定值與金鑰均儲存在您本機的應用程式資料庫中（本地 SQLite 資料庫），不會上傳到任何第三方開發者伺服器。本軟體完全開源，歡迎隨時審查程式碼。

### 9. Windows SmartScreen 提示如何處理？
因為本開源維護版本尚未向微軟購買昂貴的商業數位簽章憑證，Windows 首次啟動時可能會彈出安全性保護提示：
1. 點擊視窗上的「詳細資訊」（More info）。
2. 確認發行程式名稱為 `OhMyPPT`。
3. 點擊「仍要執行」（Run anyway）即可正常開啟。

### 10. 匯出的 PPTX 可以在微軟 Office 中編輯嗎？
可以。Oh My PPT 採用純自研的 `@arcsin1/html2pptx` 引擎，匯出的是真實微軟 OpenXML 格式（`.pptx`），文字、字型、形狀與顏色均可在 Microsoft PowerPoint、Keynote 與 WPS Office 中接續進行二次編輯。
