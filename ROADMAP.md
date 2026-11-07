# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-11-08 依 `main` `376ce83` 查的快照，開工前先重查 GitHub。

## 現況

`oh-my-ppt` 是 `arcsin1/oh-my-ppt` 的 Windows-only 維護 fork（Electron＋React＋TypeScript 的本地優先 AI 簡報工具，`FORK.md`）。最近 release 是 v2.6.1（2026-11-07，tag 指向 `095165e`，資產只有 NSIS 安裝檔與 blockmap），`package.json:3` 同為 2.6.1；v2.6.0 之後的使用者可見修正都已打進這個安裝檔。
健康度（2026-11-08 `gh` 查詢）：open PR 0、code scanning 0；CI、CodeQL 在 `main`（`376ce83`）最近一次皆 success；Dependabot 有 1 筆 open（#73 `minimatch`，medium、scope development，`docs/DECISIONS.md` 2026-11-08 條目判定為只在開發工具鏈、建議以 `tolerable_risk` 關閉）；`http-cache-semantics` 公告已於 2026-10-28 撤回，不再有該告警；issues 在 GitHub 上已停用，open issue 數是「未查到」，不是 0。Dependabot 的 npm 更新 run 在 `2b17d8e`（2026-10-26）修掉 `ERR_PNPM_UNUSED_PATCH` 之後已恢復：`npm_and_yarn in /. - Update #1671327775` 於 2026-11-01 success，2026-11-03 另有多筆 success；只有針對 `minimatch` 的資安更新 run 持續 failure（#1686755361、#1686778250，2026-11-07），原因見上述決策條目。上游審查水位在 `b937ae5`（v2.9.0，`tools/upstream_baseline.json`）；它不是本 fork HEAD 的祖先（本 fork 起點是上游 `6d1b08b`），這是已知情況、不是缺陷。

## 近期：可以直接動手

| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| （目前沒有）| `HANDOFF.md` 已移除（其三項決策 xlsx→exceljs、`extract-zip` 覆寫、CodeQL TOCTOU 在 `REVIEW.md` R-15、R-16、R-17 有記錄），README 版本標示已對到 `package.json` 並有測試釘住 | — | — | — |

## 中期：等條件成立再做

| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 審查上游新項目並判斷採用與否 | `Upstream check` workflow（週一）轉 failure，代表上游有水位之後的新 commit、PR、issue 或網站版本；failure 不是工具壞 | `docs/DECISIONS.md` 新增一筆逐項判斷與證據；`tools/upstream_baseline.json` 水位推進；採用者先有紅燈測試，`pnpm test` 綠。注意上游 v2.9.0 之後的功能原始碼未公開（`docs/DECISIONS.md` 2026-11-02 與 2026-10-24 的上游審查條目） | Claude Sonnet | `.github/workflows/upstream-check.yml:11`；`docs/DECISIONS.md` 2026-11-02 與 2026-10-24 的上游審查條目；`AGENTS.md:8` |
| 移除 `@langchain/langgraph-sdk` 的封裝 patch | 上游 SDK 的 1.x 發行檔不再 import `.pnpm` 內嵌路徑，或 `@langchain/langgraph`／`deepagents` 接受 SDK 2.x 並完成升級 | `package.json` 的 `patchedDependencies` 該鍵、`patches/@langchain__langgraph-sdk@1.12.x.patch`、`tests/unit/security/langgraph-sdk-patch.test.ts` 第二條同一個 commit 移除；`pnpm install --frozen-lockfile`、`pnpm test`、封裝冒煙皆綠；下一次 Dependabot npm run success | Claude Sonnet | `docs/DECISIONS.md` 2026-10-26 條目（觸發條件段） |
| 重審 `minimatch` 告警的處置 | `pnpm why minimatch --prod` 出現 `>= 7.0.0, < 11.0.1` 的版本，或 `eslint`／`electron-builder` 發布改用 minimatch >= 11 的版本（見 `docs/DECISIONS.md` 2026-11-08 條目的重審條件） | 升級後 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm run build` 與封裝冒煙皆綠；`gh api repos/SanHsien/oh-my-ppt/dependabot/alerts?state=open` 無 minimatch 項目；Dependabot 的 minimatch 更新 run 不再 failure | Claude Sonnet | `docs/DECISIONS.md` 2026-11-08、2026-11-04 條目；2026-11-08 `pnpm why minimatch` |
| 把 geometry inspector 接進生成、編輯或預覽流程，並一併處理寫死 1920×1080 的畫布尺寸 | 維護者決定要讓版面量測實際影響產出（目前未接線，不影響產出） | 模組接上後，9:16、1:1 等比例投影片不再誤報下緣溢出（先有重現測試）；`FORK.md` 與 `README.md:149` 的「尚未接上」敘述同一個 commit 更新；`pnpm test` 綠 | Claude Opus | `FORK.md:37`；`src/shared/geometry-inspector.ts:73`；深掃報告 F9b |

## 刻意不做

| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 為了讓警報消失把 `http-cache-semantics` 升到 4.3.0 | 實測 4.3.0 與 4.2.0 對同一組 `max-stale` 請求行為相同，升版只會消警報、漏洞還在（`docs/DECISIONS.md` 2026-11-08 `http-cache-semantics` 條目） | 公告已撤回（`docs/DECISIONS.md` 2026-11-08 條目），不重新考慮 |
| 用 `allowUnusedPatches`、放寬 unused-patch 檢查，或在 `dependabot.yml` 用 ignore 擋 SDK 傳遞依賴 | patch 仍是必要的；ignore 只過濾直接依賴，擋不住傳遞重解析，加了只是裝飾（`docs/DECISIONS.md` 2026-10-26 條目 決定 2、3） | 移除 patch 的觸發條件成立後不再需要 |
| 把完整 vitest 或產品構建放進 `tools\dev_check.ps1` | 本機提交閘門要維持輕量（`AGENTS.md:11`）；產品測試已由 CI 的 `product tests (windows / node 24)` job 跑 | 維護者改變本機閘門的定位 |
| 恢復 macOS／Linux 打包或平台分支 | 本 fork 只維護 Windows 11，相關設定與二進位資源已全數刪除（`FORK.md:9`、`CHANGELOG.md` v2.5.3 段） | 維護者明確要求支援其他平台 |

## 維護方式

fork：直接推 `main`。上游每週一由 `Upstream check` 檢查，紅燈就走上面的審查列；Dependabot 每週一開 PR，合併前先讀 `gh pr diff`；發版只在維護者決定時進行，純文件與內部整理不 bump 版本。
