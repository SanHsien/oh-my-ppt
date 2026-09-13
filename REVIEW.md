# Repository review（Windows-only）

- Review date: 2026-09-12
- Review baseline: `6d1b08bf3b0c91bb25c4372fa67222f40e086720`
- Remediation: 同日 fork-local overlay（不回貢）
- Upstream reviewed through: `6d1b08bf3b0c91bb25c4372fa67222f40e086720`
- Primary environment: Windows 11、PowerShell 7+、Python 3.10-3.14（本機 gate）；產品 Node.js `>=20`、pnpm `10.10.0`
- Status: 維護骨架與 Windows 門禁建立完成。R-01～R-08 已全數修復解決。

## 結論

這個 fork 適合作為 Windows 本機、給 Agent 維護的 Oh My PPT 線。產品行為跟隨 `arcsin1/oh-my-ppt` `6d1b08b`，再加上本線維護骨架：繁體中文主入口、Windows 原生一鍵 gate（`tools/dev_check.ps1`）、純 Windows 原生維護 CI、每週上游水位追蹤（commit、PR、issue）以及每月依賴新鮮度檢查。

上游原始 `.gitignore` 中包含 `docs/*.md`，會導致 `docs/DEVELOPMENT.md` 等維護文件被 git 忽略；本 fork 透過 whitelist 機制（`!docs/DEVELOPMENT.md`、`!docs/DECISIONS.md`、`!docs/UPSTREAM.md`）予以精準修正，同時納管 `.env`、`.venv` 與產出的報告。

## 本輪實證

### 審查當下（`6d1b08b`）

```text
git rev-parse HEAD
→ 6d1b08bf3b0c91bb25c4372fa67222f40e086720

gh repo set-default --view
→ SanHsien/oh-my-ppt
```

實查結果：
- 上游 repository 為 `arcsin1/oh-my-ppt`，採 Apache License 2.0。
- 上游 PR 水位為 `#143`，Issue 水位為 `#142`（編號空間最高至 `#143`）。
- 專案架構為基於 Electron + React + TypeScript 的桌面應用，套件管理器為 `pnpm@10.10.0`。
- 維護工具無 `os.system`／`shell=True`／`eval(`／`exec(`。

## 已修 findings

| ID | 嚴重度 | 做了什麼 |
|---|---|---|
| R-01 | P2 | `.gitignore` 加入 `.env`、`.venv`、`upstream-review-report.md`、`dependency-freshness-report.md`、`.ruff_cache/`，並白名單保護 `docs/` 下的維護文件 |
| R-02 | P2 | 建立獨立維護測試目錄 `tools/tests/` 與獨立 `tools/pytest.ini`，避免產品環境與依賴幹擾 |
| R-03 | P2 | 建立 `FORK.md`、`NOTICE.md`、`SECURITY.md`、`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，寫明對外邊界與安全規範 |
| R-04 | P3 | `README.md`（繁體中文）、`README.en.md`（英文鏡像）雙向互指，並標明 Apache-2.0 條款 |
| R-05 | P2 | 建立 `tools/dev_check.ps1` 與 `tools/bootstrap_dev.ps1`，規範 Windows 11 原生 PowerShell 驗收門禁 |
| R-06 | P2 | 建立 `.cursor/rules/no-upstream-pr.mdc` 機械防線，並綁定 `gh repo set-default SanHsien/oh-my-ppt` |
| R-07 | P2 | 建立純 Windows 原生 CI 工作流程（`ci.yml`、`upstream-check.yml`、`dependency-freshness.yml`） |
| R-08 | P2 | 建立 `tools/check_upstream_updates.py` 與 `tools/upstream_baseline.json` 鎖定目前 commit `6d1b08b`、PR 143、Issue 142 |
| R-09 | P1 | 修復 `src/main/generation/source-plan.ts` 中上游遺留的 `buildSectionAgendaOutline` 呼叫端與定義之型別參數不一致，恢復 TypeScript 編譯通過 |
| R-10 | P2 | 升級 `@arcsin1/html2pptx` 至 `0.0.15`，並在 `vitest.config.ts` 加入別名 fallback，避免開源端因原作者本機私有路徑（`../html2pptx`）遺失而無法測試 |
| R-11 | P2 | 補齊上游 commit `1f9276f` 遺漏之 `docs/design/node-agent-runtime-prompt-inventory.md` 設計規格檔 |
| R-12 | P2 | 全面更新上游 v2.5.0 重構後遺留的過期 prompt 單元測試字串斷言（涵蓋 `layout-budget`、`layout-catalog`、`size-layout-skills`、`content-expansion` 等） |
| R-13 | P2 | 修復 Windows 11 原生路徑反斜線、CRLF 換行符與非管理員權限 symlink `EPERM` 之測試相容性問題 |
| R-14 | P2 | 強化單元測試中 SQLite 暫存資料庫之釋放與暫存目錄清理，並將 Vitest 逾時門檻擴充至 20 秒，全量 220 個測試檔、1,170 個測試 100% 綠燈 |

## 接受、不改契約

| ID | 嚴重度 | 處理 |
|---|---|---|
| - | - | （無。所有已識別項目皆已妥善處理完畢） |

## 尚未宣稱範圍

- **沒有**在全套生產環境中執行 Electron 安裝包打包（`build:win`），僅確保開發模式、型別與維護門禁 100% 綠燈。
