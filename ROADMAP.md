# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-10-29 依 `main` `585c7613b05d` 查的快照，開工前先重查 GitHub。

## 現況

`oh-my-ppt` 是 `arcsin1/oh-my-ppt` 的 Windows-only 維護 fork（Electron＋React＋TypeScript 的本地優先 AI 簡報工具，`FORK.md`）。最近 release 是 v2.6.0（2026-10-17），`package.json:3` 同為 2.6.0；`main` 在那之後多了使用者可見的修正（`5fb2a00`、`55f0f01`、`7368dfc`），尚未發行。
健康度：open PR 0、code scanning 0、CI／CodeQL／Upstream check 在 `main` 最近一次皆 success；Dependabot 有 1 筆 open（high，`http-cache-semantics`，advisory 沒有修補版，已有本地 patch，見 `docs/DECISIONS.md:21`）；issues 在 GitHub 上已停用，open issue 數是「未查到」，不是 0（2026-10-29 `gh` 查詢）。
卡住的地方：Dependabot 的 npm 更新 run 在 2026-10-18、10-24、10-25 都 failure，根因 `ERR_PNPM_UNUSED_PATCH` 已在 `2b17d8e`（2026-10-26）修掉並在本機以 Dependabot 同一條指令驗證，但修正之後還沒有一次排程 run 的結果（`docs/DECISIONS.md:361-380`；Dependabot 深掃報告 2026-10-26）。上游審查水位在 `b937ae5`（v2.9.0，`tools/upstream_baseline.json`）；它不是本 fork HEAD 的祖先（本 fork 起點是上游 `6d1b08b`），這是已知情況、不是缺陷。

## 近期：可以直接動手

| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 讓 Windows 封裝冒煙斷言「沒有被擋下的外部請求」 | `blockedRequests` 只記錄不斷言，隔離網路若破功冒煙仍會過 | 冒煙腳本在 `blockedRequests` 非空時失敗；在 Windows 實跑一次（`docs/DEVELOPMENT.md:68` 的指令，會開視窗）輸出 `blockedRequests: []` 且 exit 0；人為注入一次外部 fetch 時 exit 非 0 | Claude Sonnet | `tools/windows-security-smoke.ts:21,34-42`；深掃報告「刻意不修」第一條（深掃報告（2026-10-2x）） |
| 把 CI 的 `product tests (windows / node 24)` 加進 `main` 的 branch protection 必要檢查 | 目前必要檢查只有 `test (windows / py3.14)`，新 job 紅燈不會擋合併（含 Dependabot PR） | `gh api repos/SanHsien/oh-my-ppt/branches/main/protection/required_status_checks` 的 contexts 含 `product tests (windows / node 24)`；規則上 agent 不改 branch protection，需維護者操作 | 維護者 | `.github/workflows/ci.yml:50`；深掃報告（2026-10-2x）「需要維護者注意」 |
| 移除已完成交接的 `HANDOFF.md`，並把 `README.md:115` 的版本標示對到 `package.json` 版本 | `HANDOFF.md` 是 2026-09-27 的交接，內容全是已完成事項，留著會被當成待辦；README 功能段標題寫 v2.5.3，發行版是 2.6.0。刪檔屬破壞性操作，需維護者明確同意 | `HANDOFF.md` 不在 `git ls-files`；刪除前先確認其中的決策（xlsx 改 exceljs、`extract-zip` 覆寫、CodeQL TOCTOU）在 `docs/DECISIONS.md` 或 `REVIEW.md` 有對應記錄，缺的先補；README 標示與 `package.json` 一致；`tools\dev_check.ps1` 綠（含連結檢查） | 維護者 | `HANDOFF.md:1-20`；`README.md:115`；`package.json:3` |

## 中期：等條件成立再做

| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 發下一個修補版（v2.6.1 或之後）：把 v2.6.0 之後的使用者可見修正打進安裝檔 | 維護者決定發版。這幾項在 v2.6.0 安裝檔裡仍存在：HTML 編輯器開檔遷移後寫入舊內容尾端的 NUL 殘留（`5fb2a00`）、更新對話框的更新說明按鈕打開錯誤連結（`55f0f01`）、圖表匯入 rich text／超連結／日期欄位變 `[object Object]`（`7368dfc`） | `package.json` 版本、tag、Release 一致；CI 與 CodeQL success；Release 資產只有 NSIS 安裝檔且說明如實（無可攜 zip、不含 ffmpeg）；`CHANGELOG.md` 補版本段 | 維護者 | 深掃報告（2026-10-2x） 第二段 F1／F2／F3；`package.json:3`；2026-10-29 `gh` 查詢（最近 release） |
| 審查上游新項目並判斷採用與否 | `Upstream check` workflow（週一）轉 failure，代表上游有水位之後的新 commit、PR、issue 或網站版本；failure 不是工具壞 | `docs/DECISIONS.md` 新增一筆逐項判斷與證據；`tools/upstream_baseline.json` 水位推進；採用者先有紅燈測試，`pnpm test` 綠。注意上游 v2.9.0 之後的功能原始碼未公開（`docs/DECISIONS.md:3-13`） | Claude Sonnet | `.github/workflows/upstream-check.yml:11`；`docs/DECISIONS.md:3-13`；`AGENTS.md:8` |
| 移除 `@langchain/langgraph-sdk` 的封裝 patch | 上游 SDK 的 1.x 發行檔不再 import `.pnpm` 內嵌路徑，或 `@langchain/langgraph`／`deepagents` 接受 SDK 2.x 並完成升級 | `package.json` 的 `patchedDependencies` 該鍵、`patches/@langchain__langgraph-sdk@1.12.x.patch`、`tests/unit/security/langgraph-sdk-patch.test.ts` 第二條同一個 commit 移除；`pnpm install --frozen-lockfile`、`pnpm test`、封裝冒煙皆綠；下一次 Dependabot npm run success | Claude Sonnet | `docs/DECISIONS.md:361-380`（觸發條件段） |
| 重審 Dependabot `http-cache-semantics` 的處置 | advisory 的 `first_patched_version` 出現，或套件 4.3.x 之後確實處理 `max-stale`（見 `docs/DECISIONS.md:21` 的重審條件） | 以同一組實測（shared cache、`max-age=60`＋`Set-Cookie`、`max-stale=99999999`）驗證新版 `evaluateRequest` 不再直接 hit；升版後移除 `patches/http-cache-semantics@4.2.0.patch` 與 `tests/unit/security/dependency-boundaries.test.ts` 對應斷言；`gh api repos/SanHsien/oh-my-ppt/dependabot/alerts?state=open` 無該筆 | Claude Opus | `docs/DECISIONS.md:21`；2026-10-29 `gh` 查詢（安全告警） |
| 把 geometry inspector 接進生成、編輯或預覽流程，並一併處理寫死 1920×1080 的畫布尺寸 | 維護者決定要讓版面量測實際影響產出（目前未接線，不影響產出） | 模組接上後，9:16、1:1 等比例投影片不再誤報下緣溢出（先有重現測試）；`FORK.md` 與 `README.md:149` 的「尚未接上」敘述同一個 commit 更新；`pnpm test` 綠 | Claude Opus | `FORK.md:37`；`src/shared/geometry-inspector.ts:73`；深掃報告 F9b |
| 確認 Dependabot 的 npm 更新 run 在修正後成功 | `2b17d8e` 之後第一次排程的 npm 更新 run 完成（下次排程是週一 06:00 Asia/Taipei）；npm 與 electron 的更新 run 持續失敗代表依賴 PR 一個都開不出來 | `gh run list --repo SanHsien/oh-my-ppt --limit 15` 找 `npm_and_yarn` 的更新 run，最近一次在 `2b17d8e` 之後且 conclusion=success；若仍失敗，把新錯誤碼（`ERR_PNPM_PATCH_FAILED` 或 `ERR_PNPM_UNUSED_PATCH`）寫進 `docs/DECISIONS.md` 2026-10-26 條目的「觸發條件」處理 | Claude Haiku | `docs/DECISIONS.md:361-380`；`.github/dependabot.yml`（weekly、monday 06:00）；2026-10-29 `gh` 查詢（workflow 清單）  |

## 刻意不做

| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 為了讓警報消失把 `http-cache-semantics` 升到 4.3.0 | 實測 4.3.0 與 4.2.0 對同一組 `max-stale` 請求行為相同，升版只會消警報、漏洞還在（`docs/DECISIONS.md:21`） | 上述「重審 `http-cache-semantics`」那一列的觸發條件成立 |
| 用 `allowUnusedPatches`、放寬 unused-patch 檢查，或在 `dependabot.yml` 用 ignore 擋 SDK 傳遞依賴 | patch 仍是必要的；ignore 只過濾直接依賴，擋不住傳遞重解析，加了只是裝飾（`docs/DECISIONS.md:361-380` 決定 2、3） | 移除 patch 的觸發條件成立後不再需要 |
| 把完整 vitest 或產品構建放進 `tools\dev_check.ps1` | 本機提交閘門要維持輕量（`AGENTS.md:11`）；產品測試已由 CI 的 `product tests (windows / node 24)` job 跑 | 維護者改變本機閘門的定位 |
| 恢復 macOS／Linux 打包或平台分支 | 本 fork 只維護 Windows 11，相關設定與二進位資源已全數刪除（`FORK.md:9`、`CHANGELOG.md` v2.5.3 段） | 維護者明確要求支援其他平台 |

## 維護方式

fork：直接推 `main`。上游每週一由 `Upstream check` 檢查，紅燈就走上面的審查列；Dependabot 每週一開 PR，合併前先讀 `gh pr diff`；發版只在維護者決定時進行，純文件與內部整理不 bump 版本。
