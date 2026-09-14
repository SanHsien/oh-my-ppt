# 維護決策

## 2026-09-12：建立 Windows-first 維護型 fork

**決定**：fork `arcsin1/oh-my-ppt`，保留 Apache License 2.0 與完整 Git 歷史。本線預設分支用 `main`。本線聚焦繁中文件、Windows 開發 gate、Windows CI，以及逐筆審查的上游追蹤。

**理由**：Oh My PPT 是目前極具實用價值的開源本地優先 AI 簡報排版引擎，結合 Electron、可編輯 HTML 與本地模型相容架構。本 fork 補足 Windows 11 原生開發／驗收骨架、繁體中文入口，以及可審計的上游追蹤機制。

**限制**：
- 不把 fork 包裝成原創專案，不移除原作者與官方連結。
- 維護 gate 不預設強加龐大的 Electron 完整構建。
- 上游更新必須逐筆審查。

## 2026-09-12：上游檢查涵蓋 Commit、PR 與 Issue 三面向

**決定**：`check_upstream_updates.py` 以 `--state all` 收集上游 PR 與 Issue，並追蹤 Commit SHA。`gh` 失敗時 fail closed（exit 2）。
首次審查水位鎖定：
- Commit: `6d1b08bf3b0c91bb25c4372fa67222f40e086720`（`feat: v2.5.0 doc`）
- PR: `#143`
- Issue: `#142`

**理由**：排程報告必須確保「未檢查」與「沒有新變更」截然分明，並只追蹤增量變更。

## 2026-09-12：維護門禁與產品依賴解耦

**決定**：`tools/dev_check.ps1` 僅依賴輕量 Python 維護工具（pytest, ruff），秒級完成靜態分析、契約測試與文件檢查；避免因 Electron / Node 原生模組安裝耗時而拖慢日常 gate 執行效率。

**理由**：對齊 SanHsien 體系其他維護 fork 的標準規範，確保一鍵驗收精準且高效。

## 2026-09-12：日常直接推 main

**決定**：日常維護修改在本機跑 `tools\dev_check.ps1` 後直接推 `origin/main`。Dependabot 與外部貢獻仍走 PR，合併前讀 diff。

**理由**：對齊 SanHsien 體系其他維護 fork 的治理規範。

## 2026-09-13：修復上游 v2.5.0 斷裂之單元測試與 Windows 11 原生相容性

**決定**：
1. 修復 `src/main/generation/source-plan.ts` 中上游遺留之 TypeScript 型別錯誤（`targetLength` 參數傳遞）。
2. 解鎖原生 Electron 測試二進位檔環境，補齊 `docs/design/node-agent-runtime-prompt-inventory.md`。
3. 升級 `@arcsin1/html2pptx` 至 `0.0.15`，並在 `vitest.config.ts` 加入別名 fallback，確保開源 fork 端不依賴原作者本機私有路徑。
4. 全面更新因上游 v2.5.0 提示詞詞彙重構（`canvas-scenario.ts`、`SKILL.md`、`catalog.md`）所導致的 30+ 處過期字串斷言（`layout-budget.test.ts`、`layout-catalog.test.ts`、`size-layout-skills.test.ts`、`source-plan.test.ts`、`source-grounding.test.ts` 等）。
5. 針對 Windows 11 原生環境規範路徑正規化（`path.resolve`）、CRLF 換行處理、非管理員符號連結 `EPERM` 捕捉，以及 SQLite 資料庫清理之暫存目錄釋放保護。
6. 全量測試門禁達成 220 個測試檔、1,170 個測試全數通過（0 failed, 10 skipped）。

**理由**：確保任何在 Windows 11 上參與協作的開發者與自動化代理程式，皆能獲得完全一致、確定性的綠燈驗收體驗。

## 2026-09-13：全庫簡體中文轉繁體中文、README 去廣告統一、上游評估與發布

**決定**：
1. 移除 `README.zh-CN.md`，不再保留簡體中文版 README。
2. 統一 `README.md`（繁體中文）與 `README.en.md`（英文鏡像）之章節架構、功能描述與文件連結；全數移除上游個人贊助 QR Code（微信/支付寶）、社群群組（微信群/QQ群/Discord）與贊助者廣告清單。
3. 針對 README 中沿用之上游簡體中文介面截圖，標註「初期圖片來源為上游，供參考用；後續將以繁體中文重新截圖」。
4. 將全專案（包含文件 `CHANGELOG.md`、`SponsorsList.md`、`FORK.md`、`REVIEW.md`、UI 語系 `src/renderer/src/i18n/zh.ts`、84 組風格庫 `resources/styles/*/style.json` 與 `preview.html`、原始碼註解與測試）之簡體中文全面轉換為繁體中文。
5. 上游狀態審查：上游 `arcsin1/oh-my-ppt` 最新 commit 維持於 `6d1b08b`（即 `v2.5.2`），無新提交需要合併；社群 PR #143（MCP Bridge）與 PR #139（OrcaRouter）目前均在上游開啟（OPEN）未合併狀態，且 PR #143 變更涉及 64 個核心檔案，評估維持追蹤、待上游主線審查合併後再行引進。
6. Tag 與 Release 管理：清理歷史舊版 tag，僅保留最新版本 tag `v2.5.2`，並於 `SanHsien/oh-my-ppt` 補發正式 GitHub Release。

**理由**：落實使用者對繁體中文優先、無廣告、介面一致性與乾淨發布的要求。
## 2026-09-13：聚焦純 Windows 11 平台維護，移除 macOS 與 Linux 相關代碼與資源

**決定**：
1. 專案轉為純 Windows 維護模式，刪除所有 macOS 與 Linux 平台相關檔案（`build/entitlements.mac.plist`、`build/icons/icon.icns`、`resources/slide-pack-darwin-arm64`、`resources/slide-pack-darwin-amd64`）。
2. 清理 `electron-builder.yml` 與 `package.json` 中的 `mac`、`dmg`、`linux`、`deb`、`appImage` 構建目標與相應 script。
3. 清理主進程與渲染進程中多餘的 `darwin` 分支判斷（包含 window 樣式、Mac 專用打包與 ditto / codesign 調用、Dock 調用、ffmpeg 舊版命名解析，以及 `WindowControls` 中的 `isMac` 隱藏邏輯）。
4. README 與文件同步移除 macOS 安全提示與跨平台描述，宣告專案僅維護 Windows 11 原生桌面版本。

**理由**：落實使用者對 Windows-only 原生架構維護之明確要求，精簡跨平台技術包袱。
## 2026-09-13：內建離線繁體中文說明中心，徹底移除上游外鏈並納入官網定期追蹤

**決定**：
1. 將上游官方說明網站（`https://www.ohmyppt.cc`）之常見問題、模型設定指南、生圖配置與思考模型（Thinking / Reasoning）參數手冊全數抓取並轉換為繁體中文，整理為 `docs/help/` 系列文件。
2. 在客戶端內建原生說明中心頁面（`src/renderer/src/pages/help.tsx`），於 `App.tsx` 提供 `/help` 路由。
3. 側邊欄（`Sidebar.tsx`）「幫助文件」與模型設定頁（`ModelSettingsTab.tsx`）「模型說明」全面改為導向軟體內建頁面，不再外跳上游網站。
4. 主進程版本檢查更新（`lifecycle.ts`）由上游 `ohmyppt.cc/version.json` 轉向本 fork 自身的 GitHub API（`SanHsien/oh-my-ppt/releases/latest`），徹底阻絕背景外連上游站點。
5. 擴充 `tools/check_upstream_updates.py` 與 `tools/upstream_baseline.json`，將上游官方說明網站納入第四維度追蹤。當上游官網發布新版本或文件變動時，排程門禁自動發出警報並阻擋 `--strict`。
6. 版本遞增為 `2.5.3`，重新編譯全量 Windows 安裝包與綠色可攜版，推送到最新 Release。

**理由**：實現 100% 離線優先、零外連依賴，並建立全方位（Commit + PR + Issue + Website）上游異動感知機制。

## 2026-09-14：設計並實作深色主題（Midnight Forest 暗黑森林）與切換機制

**決定**：
1. 設計專屬深色模式「Midnight Forest（暗黑森林）」：以深苔墨綠 `#141714` 為基底，搭配薄荷青柔白 `#e3e9dd`、沈穩綠石 `#7ba368` 與微光陰影，延續專案原生的自然有機美學。
2. 實作完整深色主題切換支援：
   - 在 `src/renderer/src/index.css` 定義 `.dark` 與 `[data-theme="dark"]` 之顏色變數、背景漸變與 `.soft-*` 卡片／輸入框陰影。
   - 建立 `src/renderer/src/components/ThemeToggle.tsx` 元件，於頂部標題列（Titlebar）與側邊欄頂端提供即時切換按鈕。
   - 於設定頁「通用設定」提供「淺色模式」、「深色模式」與「跟隨系統」三大主題選項，設定持久化於 SQLite 與 localStorage。
   - 於 `App.tsx` 建立全局主題監聽與系統色彩偏好（`prefers-color-scheme`）聯動。
3. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新發行至 GitHub Release。

**理由**：提升低光環境下長時間製作與編輯簡報的視覺舒適度，落實使用者對黑暗模式的明確需求。
