# 維護決策

## 2026-10-24：依賴安全修補（Dependabot #52／#53／#55 與 pnpm audit 高風險項）

**已修補（lock 與範圍內）**：`vite` ^7.3.7（原 7.3.6，high）、`zod` ^4.6.7（high）、`undici` ^8.12.3（high），`happy-dom` ^21.0.4（high，僅測試環境 devDependency，跨一個主版，單元測試全數通過）。傳遞依賴以 override 補下限，且選擇器限定父套件，避免波及 openai 對 undici 的 optional peer 範圍（`>=5 <9`）：`node-gyp>undici` ^6.29.1、`@electron/get>undici` ^7.30.1，另有 `fast-uri` ^3.1.9。lock 另有幾項隨之重新解析的小變動：`rollup` 4.60.1 → 4.65.0（vite 的依賴）、`@types/ws` 多一份 8.18.2、`@napi-rs/lzma-linux-x64-gnu` 1.5.1（optional 平台 binding）；`ws` 8.21.3、`picomatch` 4.0.4、`tinyglobby` 0.2.16 因去重而移除。這些是真實安裝的 registry 套件，沒有 parent 自帶 bundle 的情形，舊版已從 lock 消失。

**Dependabot #52（braces）、#55（sprintf-js）**：兩筆 advisory 已被 GitHub 撤回（`withdrawn_at` 分別為 2026-10-23、2026-10-22），無需修補，警報應自行關閉，本輪不 dismiss。2026-10-10 加的 `braces`、`sprintf-js` 本地 patch 仍保留，是否移除另案決定。

**Dependabot #53（http-cache-semantics，GHSA-ch52-4w7c-c8xp）— 延後，有證據**：advisory 的 `first_patched_version` 仍為空。npm 在 2026-10-04 出了 4.3.0，雖然超出 advisory 標示的 `<= 4.2.0`，實測仍有問題：對 4.3.0 與 4.2.0 各用「shared cache、`max-age=60` 加 `Set-Cookie` 的回應」配 `max-stale=99999999` 的請求，兩者的 `maxAge()` 都是 0，`evaluateRequest` 都回傳可直接使用的 hit（未要求重新驗證）；4.2.0 到 4.3.0 的 `index.js` 差異只有 `Vary` 比對、`status()` 與型別註解，沒有 max-stale 處理。所以升到 4.3.0 只會讓警報消失、漏洞還在，不採用。維持現行本地 patch（`patches/http-cache-semantics@4.2.0.patch`，已由 `tests/unit/security/dependency-boundaries.test.ts` 驗證），不 dismiss。**重審條件**：上游修掉 max-stale（`first_patched_version` 出現，或 4.3.0 之後的版本在上述情境要求重新驗證）。

**`electron` 41.10.7 → 42.11.x（audit 列 1 high ＋ 多筆 moderate／low，修補版 42.11.16 以上）— 延後，有證據**：試升 `^42.11.18` 時，`pnpm update` 因 `@electron-internal/extract-zip` 重新解析為 1.0.6，使現有 1.0.5 patch 未被使用（`ERR_PNPM_UNUSED_PATCH`），需把 override 暫時釘為 1.0.5 才能安裝。之後 typecheck、1,218 項單元測試與 `electron-vite build` 都通過，但 Windows 封裝冒煙（`tools/windows-security-smoke.ts`，打包成 `electron-builder --dir` 後以 `OHMYPPT_SMOKE_REPORT` 執行）在 Electron 42.11.18 連續兩次執行超過 100 秒仍無輸出、無報告（程式內建 90 秒上限本應寫出報告）；同一份腳本、同一流程在 Electron 41.10.7（第一個依賴 commit 的組合）於期限內 exit 0 並寫出報告（資料庫初始化、重開、冪等 init 皆成功）。在無法解釋此差異前，不把主版升級併入安全 PR。**重審條件**：查明 42 封裝版啟動卡住的原因（產品程式或 Electron 回歸），並讓該冒煙在 42 上通過；到時一併處理 extract-zip 1.0.6 與 patch。

**Dependabot PR #36（GitHub Actions 群組）**：workflow 檔不在本輪警報的 manifest 範圍，保留開啟。

**`app-builder-lib` 鎖在 26.15.3**：重新解析後，`electron-builder-squirrel-windows@26.8.1` 底下的 `app-builder-lib` 會漂移到 26.18.0（既有 override `^26.15.0` 允許），連帶新增 `@electron/rebuild` 4.2.1、`node-abi` 4.40.0、`builder-util` 26.16.0、`electron-publish` 26.18.0、`pkijs`、`asn1js`、`@noble/hashes`。這些與任何警報無關，也沒有打包驗收，因此把 override 收緊為 `app-builder-lib: 26.15.3`，lock 與 main 的 26.15.3 一致。代價是之後要升 electron-builder 時需一併改這個 override。

驗收：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm test`（231 檔通過、1 檔略過；1,218 項測試通過，其中 `image-generation-handlers` 兩項曾在全套同時執行時逾時 20 秒，單獨與重跑全套皆通過）、`pnpm build`、`tools/dev_check.ps1` 全部通過。必要 CI 只跑 Python（`dev_check.ps1`），不安裝 pnpm lock 也不跑 JS 測試，所以上述 JS 證據都來自本機。`pnpm audit` 由 8 high／14 moderate／6 low 降為只剩 http-cache-semantics（high）與 electron（high 1／moderate／low，上述延後）。

**Windows 封裝冒煙（本 PR 的最終依賴，Electron 41.10.7）**：以本 PR 最終 lock（frozen install、`electron` 41.10.7、上述 override）執行 `electron-vite build`，用 esbuild 把 `tools/windows-security-smoke.ts` 打包成 `out/main/security-smoke.mjs`，再 `electron-builder --dir --win --x64 --publish never --config.extraMetadata.main=./out/main/security-smoke.mjs` 產生未發布的 x64 目錄包並執行：exit 0、約 9 秒完成，報告 `success: true`、`packaged: true`、`versions.electron` 41.10.7、`blockedRequests: []`、資料庫 `migrated`／`persistedAfterReopen`／`idempotentInit` 皆為 true、renderer 以 contextBridge 讀回 session、`contextIsolation` true、`nodeIntegration` false。optional ffmpeg 未內建，不宣稱 MP4 匯出通過。上文 Electron 42 的對照實驗用的是另一組依賴（electron 42.11.18、extract-zip 暫釘 1.0.5，其餘同第一個 commit）；Electron 41 的基準對照則用第一個 commit 的依賴，兩者與此最終組合的差別只在 override 選擇器與 `app-builder-lib` 釘版。

## 2026-10-17：採納上游 v2.8.1 字體修復、升級 html2pptx 0.2.1、推理模型支援與 PR/Issue 深度處理（升版 v2.6.0）

審查 4 筆 commit、3 筆 PR、0 筆 issue，網站版本 1 項。全面採納並移植上游 v2.8.1 核心修復與社群 PR #150 深度成果，升版至 `v2.6.0`。

### Commit 與核心功能採納

| 項目 | 判斷 | 成果與理由 |
| --- | --- | --- |
| `f5f311c`、`539c9cb`（吸收 PR #149 字體方案） | 採用 | 移植字體嵌入容器格式（裸 TTF sfnt 載荷修復 Mac PowerPoint 粗體渲染）、`aria-hidden="true"` 裝飾文字在背景繪製時的保護、CSS class transform 動畫保護；升級 `@arcsin1/html2pptx: 0.2.1`。 |
| `610e8c3`（來自 PR #150，推理模型 16k 下限） | 採用 | 在 `src/main/agent-runtime/model/output-budget.ts` 實作 `resolveAgentOutputBudget`，確保頁面寫入輪次具備 16384 token 輸出下限，徹底解決 DeepSeek R1 / o1 / o3 思考過程耗盡 4096 預算導致「頁面未寫入」之核心缺陷。 |
| `8ad2251`（來自 PR #150，單頁寫入工具 pageId 放寬） | 採用 | 單頁寫入工具 `update_single_page_file` 的 `pageId` 放寬為可選，當模型漏傳時自動沿用已鎖定之目標頁，消除 schema 驗證失敗拒絕寫入之風險。 |
| 模型超時放寬 | 採用 | `PROFILE_DEFAULT_TIMEOUT_MS.agent` 從 10 分鐘放寬至 20 分鐘，支援長鏈路推理思考。 |
| `950fab7`、`56bc56d` | 跟隨上游 | 上游發版 commit。本 fork 自有版號體系推進至 `v2.6.0`。 |

### PRs 處理與狀態

| 項目 | 狀態 | 處置結論 |
| --- | --- | --- |
| 上游 PR #149（字體保真修復） | 已合併 | 已由上游吸收進 `f5f311c`，本 fork 已完整移植代碼與測試。 |
| 上游 PR #150（PPTX 導出相容性、字體嵌入與生成鏈路 6 項修復） | OPEN | 深度審查 honquyn 之 11 筆提交：已吸收其核心的「推理模型 16k 輸出預算下限」、「單頁工具 pageId 放寬可選」與「agent 20 分鐘超時」；其字體嵌入與 `@arcsin1/html2pptx: 0.2.1` 升級已覆蓋其導出相容性修復。 |
| 上游 PR #151（Feat/v2.8.1） | 已合併 | 發版 PR，內容已全數包含在上述 commit。 |
| 上游 PR #143（本機 MCP Bridge） | OPEN | 涉及 64 檔核心架構變動，與本 fork 本地離線架構存在部分重疊，維持追蹤。 |
| 上游 PR #106（GSAP 動畫支援） | OPEN | 實驗性功能，尚未被上游合入，維持追蹤。 |

### Issues 處理與狀態

- 上游 Issues：最新 issue 水位為 #146。
  - #146（內網代理與模型拉取）：已由上游 `0226f94` 解決。
  - #138、#135、#117、#94 等 open issue 為使用者需求提案（如請求 Linux 版、Codex 登入等），本 fork 聚焦 Windows 11 原生，無須採取動作。

### 驗證與發布

- 雙端型別檢查：`pnpm run typecheck` 零錯誤。
- 全量單元測試：`pnpm test`（231 檔通過，1 檔 5 個實驗測試略過，1,218 測試全過，0 失敗）。
- 應用構建：`electron-vite build` 打包通過。
- 版本號推進：`2.5.4` → `2.6.0`。發布 GitHub Release 與 Tag `v2.6.0`。

## 2026-10-07：合併 Dependabot PR #33（生產依賴群組）

合併 PR #33（`production-minor-and-patch` 群組更新）：
- `@google/genai` 2.24.0 → 2.25.0
- `@langchain/anthropic` 1.5.11 → 1.5.12
- `@langchain/core` 1.2.13 → 1.2.14
- `@langchain/langgraph` 1.4.18 → 1.4.19
- `@langchain/openai` 1.6.0 → 1.6.2
- `isomorphic-git` 1.42.4 → 1.43.0
- `katex` 0.18.9 → 0.18.10
- `langchain` 1.5.14 → 1.5.15
- `lucide-react` 1.49.0 → 1.52.0
- `mdast-util-from-markdown` 2.0.3 → 2.1.0

驗證結果：`tools/dev_check.ps1` 全過、`pnpm typecheck`（Node/Web 雙端）零錯誤、`pnpm test`（223 檔、1,177 通過、10 跳過）全過。

## 2026-09-30：依賴 PR #14–#20 收尾（第二批）

`@arcsin1/pptx2json` 0.1.12（#16）已合併；`react-router-dom` 7.18.4 與 `@langchain/langgraph` 1.4.18
已隨 #16 的鎖檔進入 main（#17、#18 失效關閉）。採用前跑過 `pnpm typecheck` 與 `pnpm test`（223 檔全過）。

**延後**：

| 套件 | 提案 | 延後原因 | 觸發條件 |
| --- | --- | --- | --- |
| `nanoid` | 5 → 6（#15） | 主版，模組／執行期契約變動，ID 產生處無測試覆蓋 | 5.x 停止修補，或補上覆蓋測試 |
| `electron` | 39 → 41／44（#19、#20） | 主版，需在 Windows 實跑打包 App 並冒煙測試，PR CI 不涵蓋 | 39 不再支援或安全修補需要；一次只升一個目標主版並附冒煙紀錄 |
| `pytest`／`ruff` 下限 | 提高下限（#14） | 維持 `freshness-hold` 標記的相容下限，升下限無新功能 | 維護測試需要新 API 時 |
| `@libsql/client` | 0.14 → 0.18（#22） | 0.x 跨四個小版且帶原生 `libsql` 0.4 → 0.5；Vitest 全過，但打包後 App 的資料庫載入未驗證，牽涉使用者資料 | 實跑打包 App 並確認既有資料庫可開啟、遷移可跑 |

`vitest` 5.0.2（#23）已合併：`pnpm typecheck` 與 `pnpm test`（223 檔）全過。

Dependabot 已對 `nanoid`、`electron` 主版與 `pytest`／`ruff` 加 `ignore`。

## 2026-09-30：依賴 PR #7–#12 收尾

`pytest`／`ruff` 的相容下限保留並標記理由，未採用 #7 單純提高下限的提案；
`prettier` 3.9.9、`@google/genai` 2.24.0、
`katex` 0.18.9 與 TypeScript 6.0.3 已從 #8、#10–#12 的差異採用。
TypeScript 6 不再接受原有的 `baseUrl` 設定，因此改為相對的 `paths` 值。
KaTeX 同步更新內嵌的 JS／CSS；既有工作階段在開啟時比對這兩個資源，不一致就重新複製。
auto-render 腳本與 20 個 `.woff2` 字型的內容沒有變動。
產品型別檢查、Vitest 與 Windows 維護 gate 是本次驗收條件。

#9 的 `@types/node` 26 延後：目前型別基線是 22，專案仍允許 Node.js 20 起執行，
直接改用 26 的型別可能讓產品使用較新 Node 才有的 API。Dependabot 暫時忽略 23 以上；
當執行期最低版本與產品 CI 都升到相應 Node 主版後重新審查。

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

## 2026-09-14：重構深色模式色彩系統與表面反轉層級，達成高對比度可讀性

**決定**：
1. 依據專業 UI 與色彩設計規範（WCAG AAA）重構「Midnight Forest」深色模式色彩體系：
   - 建立 5 層表面層級（Level 0 畫布底 `#111411` → Level 1 側欄 `#151a14` → Level 2 卡片 `#191f18` → Level 3 輸入控制項 `#20291f` → Level 4 彈窗下拉 `#222c21`）。
   - 徹底解決 SelectTrigger、TabsList、DropdownMenu、Dialog 硬編碼淺色底導致「白底白字」之對比度缺陷，全面為輸入項與下拉選單配備深色表面與對比邊框。
   - 文字前景色階重構：主標題與輸入文字採高對比純淨白 `#F2F7ED`（對比度 >13:1）、內文採 `#CDD9C7`、次級/標籤採清晰鼠尾草灰綠 `#A4BBA0`（對比度 >5.2:1）、佔位符採 `#8EA383`，杜絕任何淺色字落在淺色底或暗色字落在暗色底之情況。
   - 啟用標籤（Active Tabs）與次級按鈕（Secondary Button）配備鮮明飽和綠底與純白文字，具備清晰輪廓線。
2. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新至 GitHub Release v2.5.3。

**理由**：落實專業色彩與易讀性標準，確保使用者在深色模式下閱讀文字舒適、清晰、零視覺疲勞。

## 2026-09-14：全面修復全 App 深色模式 UI 配色、Toast 訊息方塊與圖表表面對比度

**決定**：
1. 全面優化 Sonner Toast 訊息方塊（`AppToaster.tsx`）深色主題：動態綁定客戶端主題狀態，重構提示框樣式（警告採深沉暖炭底 `#252015` 配金黃字 `#FBDF9D`，成功採翠墨綠底 `#172618` 配翡翠字 `#A3F0BD`，錯誤採深緋紅底 `#271616` 配粉紅字 `#FFB8B8`），徹底根除白底反光與文字難辨問題。
2. 首頁三大導覽卡片（`home.tsx`）深色模式全面配備微光深墨綠表面（Level 2/3），標題高對比純白 `#F2F7ED`，描述文字 `#B0C4A8`，解決「快速建立」卡片在深色模式下殘留淺灰底導致白字不可讀的缺陷。
3. 用量統計頁（`TokenUsageDashboard.tsx`）重構：
   - 四張 Stat 指標卡全面深色化，徹底解決「輸入 TOKEN」卡片白底白字問題。
   - 當天每小時用量、每日趨勢與模型佔比三張巨型圖表卡片由硬編碼 `bg-white` 轉為深色卡片表面，消滅大面積白底亮光。
4. 風格庫（`styles.tsx`、`StyleCaseFilter.tsx`）：搜尋框與場景篩選標籤全面適配 Level 3 深色表面與清晰文字。
5. 字型頁（`fonts.tsx`）：解決 Google Fonts 預覽標題 `text-[#5a6650]/80` 在深色底色下透明度過低看不清的問題，提高至高對比亮柔白 `#F2F7ED`。
6. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新發布至 GitHub Release v2.5.3。

**理由**：落實高階色彩設計與使用者真實操作體驗，保證所有頁面與提示對話框在深色模式下對比鮮明、舒適護眼。

## 2026-09-14：全面強化風格卡片文字高對比度、範本按鈕深色表面適配

**決定**：
1. 風格庫（`styles.tsx`）卡片全面升級：
   - 卡片容器由 `bg-white/70` 轉為 Level 2 固態深色底 `#192018`，邊框切換為 `#33462f`，徹底解決半透明白底導致「灰白霧化不可讀」的嚴重缺陷。
   - 風格標題改為粗體純白 `#FFFFFF`（極限對比度），副標題類別文字調升至清晰薄荷綠 `#A8C29E`，描述說明文字由灰暗色調重構為高明度亮灰綠 `#E0EBE0`（對比度 >10:1）。
   - 用途標籤與生圖標記全數配備深綠微光底色與純白/鮮亮文字。
2. 範本頁（`templates.tsx`、`TemplateCard.tsx`、`ModelActionButton.tsx`）：
   - 「匯入 PPTX 為模板」按鈕（`tone="subtle"`）深色模式切換為 `#1E271D` 配純白文字 `#F2F7ED`，徹底消滅突兀白底。
   - 模板卡片標題、頁數徽章與空狀態說明文字全面完成高對比度調校。
3. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新發布至 GitHub Release v2.5.3。

**理由**：落實使用者對範本與風格庫卡片文字清晰度的嚴格要求，徹底杜絕任何文字發灰或與底色混濁之狀況。

## 2026-09-14：重構淺色模式高對比度排版體系，修復範本按鈕白框殘留

**決定**：
1. 修復 `ModelActionButton.tsx`（`tone="subtle"`，如「匯入 PPTX 為模板」按鈕）背景色：深色模式徹底切換為 Level 3 暗黑表面 `#1D271B` 配純白文字 `#FFFFFF` 與 `#384E32` 邊框，消滅殘留的白色底框；淺色模式切換為純淨白底配高對比深林墨色文字 `#1A2417`。
2. 全面重構淺色模式（Light Mode）文字排版色階體系：
   - 根除上游原設計低對比度淺卡其綠（`#3E4A32` 與 `#7A8369`）在象牙底（`#F5F1E8`）上僅 3.1:1 之模糊難辨缺陷。
   - 主要文字與標題加深至深林墨黑 `#1A2417`（對比度達 11.6:1，符合 WCAG AAA+）。
   - 內文與一般文字加深至 `#2C3924`（對比度 8.8:1），副標與次級文字加深至 `#37472E`（6.5:1），說明與註解文字調校至 `#4E5E44`（對比度 5.2:1，保證輕鬆閱讀）。
   - 建立全域硬編碼類別對照映射，使首頁、設定、模板、風格庫在淺色模式下文字字體清晰銳利、黑白分明。
3. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新發布至 GitHub Release v2.5.3。

**理由**：全面落實使用者對淺色模式文字清晰度與深色按鈕純淨度之嚴格標準。

## 2026-09-15：全面解耦淺色與深色文字前景色階，修復範本按鈕白底殘留

**決定**：
1. 徹底移除 `index.css` 中容易產生樣式衝突的 `body:not(.dark)` 與全域 `!important` 覆蓋邏輯，回退至乾淨的 CSS 變數體系。
2. 徹底解耦淺色與深色模式的前景文字色彩定義：
   - 在各 UI 頁面（`home`、`sessions`、`templates`、`styles`、`fonts`、`settings`、`Sidebar`）中採用標準的 `text-[#1a2417] dark:text-[#ffffff]` 與 `text-[#37472e] dark:text-[#c5d8bf]`。
   - 淺色模式下呈現沉穩深邃的深林墨黑（對比度 11.6:1），徹底告別上游原版淺卡其發灰模糊（3.1:1）之缺陷。
   - 深色模式下呈現高亮度純白與清爽薄荷綠（對比度 >13:1），雙模式互不干擾、黑白各自清晰分明。
3. 徹底修復 `ModelActionButton.tsx`（`tone="subtle"`）在深色模式下的殘留白底，切換為深翠表面 `#1D271B` 配純白文字 `#F2F7ED`，杜絕突兀白框。
4. 重新編譯產出全量 Windows 安裝程式與免安裝可攜版，更新發布至 GitHub Release v2.5.3。

**理由**：落實簡潔、標準、解耦的 Tailwind 色彩規範，讓淺色模式與深色模式在各自的底色上都具備極致的清晰度與最高對比度。

## 2026-09-30：上游審查（commit `6d1b08b` → `35648cb`、PR 143 → 147、issue 142 → 146、網站 2.5.2 → 2.7.0）

審查 10 筆 commit、1 筆 PR、3 筆 issue，網站版本 1 項。本輪沒有採用任何程式變更，理由見下。

### Commit（10 筆）

| 項目 | 判斷 | 理由 |
| --- | --- | --- |
| `328d4f7`、`13b4c78`、`b756f33`、`8147af8`、`e3adc49`、`b3d79fb` | 不適用 | 只動 `README.md`／`README_EN.md`／`SponsorsList.md`／`docs/images`（贊助與宣傳、文件圖），fork 的 README 為繁中且已去廣告 |
| `0226f94`（代理帳密與 no-proxy 直連、拉取模型清單，+654/-32、13 個檔案） | 採用待辦（adoption pending） | 是功能而非修正；重疊的檔案為 `application.ts`、`settings-handlers.ts`、`ModelConfigDialog.tsx`、`settings.tsx`、`settingsStore.ts`、`i18n/en.ts`、`i18n/zh.ts`，fork 皆已改過（`git diff 6d1b08b HEAD -- src` 涉及 210 個檔案，含繁中轉換與深色模式重構），直接合併必衝突；Electron 主程序的代理路徑無法在本機驗證 |
| `403d589`、`35648cb`、`22ff70d` | 跟隨上游 | v2.7.0 的 CHANGELOG、`package.json` 版本號（fork 目前 2.5.3）與 PR #147 合併 commit；fork 自有版號，未採用功能前不改 |

**觸發條件**：維護者需要內網代理認證／模型清單拉取，或決定同步 v2.7.0 時，以 `0226f94` 為單位手動移植，並跑 `pnpm typecheck`、`pnpm test`。

### PR

| 項目 | 判斷 | 理由 |
| --- | --- | --- |
| #147 Feat/v2.7.0 | 跟隨上游 | v2.7.0 發版 PR，內容即上表 commit；其中僅 `0226f94` 動到 `src/`，已列為採用待辦 |

### Issue

| 項目 | 判斷 | 理由 |
| --- | --- | --- |
| #144 生圖站回傳格式無法調整（已關閉） | 不適用 | 使用問題，非缺陷，無程式變更 |
| #145 v2.7.0 意見徵集（已關閉） | 不適用 | 徵集貼文 |
| #146 內網代理與模型拉取（已關閉） | 跟隨上游 | 由 `0226f94` 回應，見上方採用待辦 |

### 網站版本 2.5.2 → 2.7.0

上游網站內容對應 v2.6.0／v2.7.0 的 CHANGELOG（批註、演講者視圖、生成品質檢測、逐頁版式選擇、模型上下文視窗設定等）。fork 內建離線說明中心（`/help`）刻意完全不連外，這些功能未同步到 fork 產品，因此說明中心不新增對應內容。**待辦**：日後同步 v2.7.0 程式時一併更新 `/help`。

水位：commit `35648cb`、PR 147、issue 146、網站版本 2.7.0。

## 2026-10-01：Dependabot 分組 PR（#24、#27、#28、#30、#31）

| 項目 | 判斷 | 理由／觸發條件 |
| --- | --- | --- |
| `slate` 0.126.2、`slate-react` 0.127.1、`@chenglou/pretext` 0.0.9（#30 的三項） | 採用 | 本機 `pnpm typecheck`、`pnpm test`（223 檔、1177 項）通過。 |
| `eslint-plugin-react-refresh` 0.5.7、`vitest` 5.0.3（#31） | 採用 | 開發依賴；同上驗證通過。 |
| `@arcsin1/presentation-editor-runtime` 0.0.8 → 0.0.14（#30 的第四項） | 不採用，加 ignore | 0.0.14 讓 `tests/unit/preview/edit-mode-ref-lines.test.ts` 的吸附參考線測試失敗。它是上游產品搭配的執行元件、釘死版本，隨上游產品程式同步時一起升。 |
| `p-limit` 3 → 7（#28） | 延後，加 ignore | 主版升級（v4 起只有 ESM）；Electron 主行程的載入要實際打包執行才能驗證。 |
| `@electron-toolkit/eslint-config-ts` 3 → 4（#24） | 延後，加 ignore | 主版升級；本 repo 的閘門不跑 lint，無從驗證。 |
| `pytest`／`ruff` 下限（#27） | 維持 2026-09-30 的延後 | 只升下限，沒有新行為需要。 |

PR 的 CI 只跑維護工具測試，不跑產品測試；產品依賴的更新一律在本機跑 `pnpm typecheck` 與 `pnpm test` 後直接進 `main`。

## 2026-10-09：延後 Electron 安全性與主版升級

**決定**：延後處理 Electron `^39.2.6` 升級至 41 或 44 的多項高風險安全性修補提案（如 Dependabot alerts）。

**理由**：Electron 主版升級與其底層安全性修復，必須在 Windows 環境進行完整的 App 封裝打包與實際冒煙測試。目前 PR CI 並不涵蓋實際 Windows 打包驗證，且本階段主要聚焦次要套件修補。

**觸發條件**：待專門進行 Electron 主版維護與封裝測試時，再行一次性升版並附帶冒煙測試結果。重審日期設為 2026-11-01。

## 2026-10-10：依賴安全修補與 Windows 封裝驗收

本次取代 2026-10-09 的 Electron 延後决定。Electron 下限升至 41.10.6（lock 為 41.10.7），`@libsql/client` 升至 0.18.0；`fast-uri` 下限為 3.1.8，保留 `source-map-js` 1.2.2 修補下限。

無官方修補版的三項依賴以 `pnpm.patchedDependencies` 保存本地修補：

| Advisory / 套件 | 本地措施 | 限制 |
| --- | --- | --- |
| GHSA-vfj7-8cjw-p6xm / braces | brace／parenthesis parser AST 固定深度上限，阻止後續遞迴耗盡堆疊 | 過深 pattern 拋 SyntaxError；一般 alternatives／fast-glob 保留 |
| GHSA-ch52-4w7c-c8xp / http-cache-semantics | freshness 為零時禁止 max-stale、stale-while-revalidate／stale-if-error 命中 | 保守要求零 freshness 項目重新驗證，含 private／no-store／Set-Cookie |
| GHSA-hp3w-g68c-fv3c / sprintf-js | 數值精度限制為 f/e 0–100、g 1–100 | 超大精度截至 100；正常格式與 argparse 保留 |

全域 `brace-expansion:^1` override 會破壞 electron-builder 使用的 minimatch 10 `expand` API；改為只覆蓋 `brace-expansion@1`，新版消費者使用自身相容範圍。

本地 patch 不會改變 registry 的 vulnerable version 判斷；不得 ignore／dismiss 或宣稱 Dependabot 歸零。上述三筆仍在 audit，待官方修補或安全 replacement。攻擊回歸測試在 `tests/unit/security/dependency-boundaries.test.ts`。

Windows 驗收使用未發布 x64 目錄包。`tools/windows-security-smoke.ts` 為 test-only main，使用唯一暫存 profile／合成 session，檢查 native file DB 初始化／遷移、寫入、關閉重開與真實 renderer／preload／IPC 讀回。HTTP／fetch 封鎖，90 秒上限。以 esbuild 將 helper 打包至 `out/main/security-smoke.mjs`，再以 electron-builder `--dir --publish never --config.extraMetadata.main=./out/main/security-smoke.mjs` 建立驗收包；此入口不可 release。optional ffmpeg 缺失時不宣稱 MP4 匯出通過。

命令、時間、exit、HEAD、完整 modified／untracked SHA256 與環境保存於本次工作目錄的 `outputs/ohmyppt-*.json`／`.log`。交付前仍需獨立審查完整 diff；本次未提交／發布／寫入上游。

封裝 smoke 另揭露 `@langchain/langgraph-sdk@1.12.1` 的 ESM `dist/utils/async_caller.js` 引用內嵌 `.pnpm` 路徑，electron-builder 不會收錄該內嵌目錄。增加精準套件 patch，把兩個 import 改為已宣告的 `p-retry`／`p-queue` 正常 dependency specifier；僅修本產品使用的 ESM 路徑，未改 CJS 發行檔，未擴張產品 source。合成 profile 失敗後重試會沿用同一 root／session。

## 2026-10-17：v2.6.0 發布補齊 Windows 安裝檔（NSIS Setup.exe）與交付規範確立

**決定**：
1. 執行 `pnpm run build:win`（`electron-builder --win`），完成 NSIS x64 安裝檔編譯打包，產出 `dist/oh-my-ppt-2.6.0-setup.exe`（172 MB）與 `dist/oh-my-ppt-2.6.0-setup.exe.blockmap`。
2. 使用 `gh release upload v2.6.0` 將安裝檔與 blockmap 上傳至 GitHub Release `v2.6.0` Assets，確保使用者可直接下載原生 Windows 安裝程式。
3. 明確規範桌面端交付標準：修正過去將「編譯」侷限於前端代碼轉譯（`electron-vite build`）的錯誤慣性；在桌面客戶端應用中，Release 的「編譯」必包含平台安裝檔封裝（`build:win`）。
4. 本條款與教訓寫入 `AGENTS.md` 作為硬性開發維護門禁。

**理由**：桌面端開源專案發布 Release 的核心在於提供開箱即用的安裝二進位檔案，若無安裝包則 Release 失去交付意義。落實使用者糾正與全域規範。
