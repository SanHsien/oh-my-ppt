# 安全政策

## 支援範圍

安全修正以本 fork 的最新 `main` 為主；上游版本的問題也會視需要回報原作者。

## 私下回報

請使用 GitHub Security Advisories 的 **Report a vulnerability**
私下回報：<https://github.com/SanHsien/oh-my-ppt/security/advisories/new>。
若該入口不可用，請透過 GitHub 個人檔案聯絡維護者，不要先建立公開 Issue。

回報請包含影響範圍、重現步驟、受影響版本與最小必要證據。請勿附上真實 API key、模型憑證、
或可識別個人的機密簡報內容。

若問題也存在於上游，維護者會視需要轉報 [`arcsin1/oh-my-ppt`](https://github.com/arcsin1/oh-my-ppt)。不要在公開 Issue 放密鑰或 exploit 細節。

## 特別注意

- Oh My PPT 為本地優先架構，投影片與素材保存在本機。不要將包含敏感個資或商業機密的範例簡報提交進 repo。
- 在配置第三方模型（OpenAI / Anthropic / Gemini 等）時，API Key 保存在本機環境，不要提交 `.env` 或在對話與日誌中外洩。
- 只有本機 Ollama 途徑能夠將推論與生成完全保留在自己的電腦上。使用雲端 Provider 時請詳閱該服務商的資料政策。
- 本 fork 不代表原作者發佈官方安裝套件，請勿將本 repo 的任何發行視為官方軟體。
