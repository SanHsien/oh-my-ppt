# Fork 維護說明

本 repo fork 自 [`arcsin1/oh-my-ppt`](https://github.com/arcsin1/oh-my-ppt)，
沿用 Apache License 2.0 與完整 Git 歷史。這是基於 Electron + React + TypeScript 打造的**本地優先可編輯 AI 簡報生成與排版引擎**。

## 為什麼維護 fork

- **聚焦職場人與開發者的高效簡報工具**：自動產出大綱、排版與配圖，告別手動調整版面的痛苦，支援本地 Ollama 與各類 LLM。
- **僅維護 Windows 版本**：專為 Windows 11 原生環境（PowerShell 7+）打造，已全數刪除 macOS 與 Linux 平台之打包設定、二進位工具與分支程式碼，不提供亦不維護非 Windows 平台。
- **本 Fork 獨創「Midnight Forest 暗黑森林」深色模式**：專為長時間簡報創作設計的高對比護眼深色主題，完全遵循 WCAG AAA 對比規範，支援視窗標題列與側邊欄一鍵即時切換。
- **內建原生離線說明中心（`/help`）**：全離線繁體中文教學手冊、模型設定指引與思考模型 JSON 速查，完全阻斷上游外部連結。
- **繁體中文首選入口與全庫繁中化**：公開入口改以繁體中文為主，英文鏡像放 [`README.en.md`](README.en.md)，全庫 UI 語系、風格庫與說明文件全面繁中化。
- **建立可重現的維護門禁**：建立 Windows 原生一鍵 gate（`tools/dev_check.ps1`）、Windows CI 工作流程，以及逐筆審查的上游追蹤。
- **保護商業隱私與安全**：強化本機離線優先機制與依賴審計，不外洩工作階段或私鑰憑證。

**回貢判準：修的是上游的 bug 就送回 `arcsin1/oh-my-ppt`；這裡獨創的文件／Windows 維護骨架留在這裡。**
回貢前必須在當次對話取得維護者明確同意；「fork」「建開發環境」「比照其他 repo」都不是同意。

## 與上游的差異

| 項目 | 說明 |
|---|---|
| `README.md` | 繁體中文產品說明（主入口文件） |
| `README.en.md` | 英文鏡像說明檔 |
| `AGENTS.md` 開頭 overlay | 指向本檔；下文保留上游產品規範與 React 元件指引 |
| `FORK.md` / `NOTICE.md` / `CLAUDE.md` / `GEMINI.md` / `REVIEW.md` | 本 fork 的治理與 AI 維護單一真相源 |
| `深色主題（Midnight Forest）` | **本 fork 獨家原創**的高對比暗黑森林護眼主題，支援標題列與側欄一鍵即時切換、跟隨系統、5 層表面層級與高對比文字 |
| `內建說明中心（/help）` | 離線原生說明中心，整合常見問題、模型配置手冊與思考模型參數速查，徹底移除上游外鏈 |
| `docs/help/` | 本地離線說明手冊系列（常見問答、模型配置、思考模型參數） |
| `docs/DEVELOPMENT.md`、`docs/DECISIONS.md`、`docs/UPSTREAM.md` | Windows 原生開發步驟、決策記錄與上游追蹤 |
| `tools/dev_check.ps1` | Windows 本機一鍵維護門禁（compileall、ruff、pytest、check_links） |
| `tools/bootstrap_dev.ps1` | Windows 本機環境一鍵初始化 |
| `tools/check_links.py` | 跨維護文件的相對連結自動化校驗 |
| `tools/check_upstream_updates.py` | 上游 commit、PR、issue 水位追蹤與差異分析 |
| `tools/check_dependency_freshness.py` | 依賴新鮮度與過期版本審查 |
| `tools/upstream_baseline.json` | 上游審查水位記錄 |
| `.cursor/rules/no-upstream-pr.mdc` | 防止誤向 upstream 開 PR 的機械防護規則 |
| `.github/workflows/ci.yml` | 純 Windows 原生（windows-latest，Python 3.10–3.14）門禁 CI |
| `.github/workflows/upstream-check.yml` | 每週定期檢查 upstream/main 的未審查 commit、PR 與 issue |
| `.github/workflows/dependency-freshness.yml` | 每月定期檢查維護依賴新鮮度 |

產品核心源碼（`src/`、`tests/`、`resources/` 等）以上游為準，除非有已記錄的 fork 修正。

## 分支與 remote

- `origin/main`：SanHsien 維護主線，也是唯一長期分支。
- 日常修改直接推 `origin/main`（通過本機 `dev_check.ps1` 後），不開功能分支、不開維護 PR。
- `upstream/main`：原作者官方發行與開發主線，只追蹤、不推送。
- Dependabot 或外部貢獻者的變更走 PR，合併前必須閱讀完整 diff。

### 開 PR 的硬規則

日常 PR **只能**打進 `SanHsien/oh-my-ppt`：

根因是機制不是粗心：`gh` 在 fork clone 的**預設 repo 就是上游**，裸跑 `gh pr create` 會打到原作者 repo。

```powershell
gh repo set-default SanHsien/oh-my-ppt   # 每個 clone 先跑一次
gh repo set-default --view               # 必須回 SanHsien/oh-my-ppt
git remote -v
gh pr create --repo SanHsien/oh-my-ppt --base main --head <分支>
```

建完後核對印出的 URL 必須是 `https://github.com/SanHsien/oh-my-ppt/pull/...`。
若不是 `SanHsien` 帳號，立刻關閉 PR 並留言道歉說明，禁止推送到上游。

對上游開 PR 的**唯一例外**：維護者在這次對話明確同意回貢。下列都不是例外：fork、建置開發環境、開 PR、比照其他 repo、合併回 main。

不要 `git push upstream`。同步方式見 [`docs/UPSTREAM.md`](docs/UPSTREAM.md)。

## 換一臺電腦怎麼開發

### 1. 維護骨架門禁（必備）

```powershell
git clone https://github.com/SanHsien/oh-my-ppt.git
cd oh-my-ppt
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

### 2. 桌面應用產品開發

```powershell
pnpm install
pnpm dev
```

完整產品測試與型別檢查：

```powershell
pnpm typecheck
pnpm test
```

## 相鄰的維護中 repo

| 層 | Repo | 做什麼 |
| --- | --- | --- |
| 派工決策 | [agent-advisor](https://github.com/SanHsien/agent-advisor) | 風險分流路由 `solo`／`delegate`／`audit`／`full` |
| 動作攔截 | [harness-guard](https://github.com/SanHsien/harness-guard) | agent runtime hook，實際攔截危險指令、無證據宣稱、紅燈提交 |
| 產出品質 | [ai-quality-gates](https://github.com/SanHsien/ai-quality-gates) | 覆蓋率、突變測試、圈複雜度、依賴結構、有界 loop policy |
| 交付流程 | [paulsha-cortex](https://github.com/SanHsien/paulsha-cortex) | Candidate → Verify → Independent Review → Delivery → CompletionRecord |
