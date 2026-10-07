# 開發環境

維護者與 AI 接手用的開發文件。產品使用方式在 [`README.md`](../README.md)；上游同步在 [`UPSTREAM.md`](UPSTREAM.md)；決策在 [`DECISIONS.md`](DECISIONS.md)。

## 架構

```text
src/
  ├── main/         Electron 主進程（視窗管理、IPC 通訊、本地 SQLite / Drizzle ORM、本地檔案系統）
  ├── renderer/     React 渲染進程（UI 介面、Zustand 狀態管理、畫布編輯器、TailwindCSS）
  └── shared/       跨進程共享型別與常數
tests/
  └── unit/         Vitest 單元測試
tools/              fork 維護工具（Windows gate、上游檢查、相對連結檢查、依賴新鮮度）
  └── tests/        維護契約測試
docs/               fork 維護與治理文件
```

## 本機開發（Windows 11 原生）

### 維護骨架（必跑）

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
$env:PYTHONUTF8 = "1"
pwsh -NoProfile -File tools\dev_check.ps1
```

等價一鍵指令：

```powershell
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

這套 gate **不安裝** 龐大的 Node 模組或 Electron 執行檔。它只證明維護文件、工具與 CI 骨架可用。

### 產品開發與測試

若需進行 Electron 桌面應用程式的開發與偵錯：

```powershell
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 執行型別檢查
pnpm typecheck

# 執行單元測試
pnpm test
```

> [!NOTE]
> 上游明確指示：不要跑 `npm run lint` 或 `npm run build`，驗證時以最小相關單元測試為主。

## Canonical Gate

`tools\dev_check.ps1` 會依序執行：

1. `python -m compileall`（`tools`）
2. `ruff check`（E9 + F，僅檢查 `tools`）
3. `pytest tools/tests`（使用獨立的 `tools/pytest.ini`）
4. `python tools/check_links.py`（驗證所有維護文件相對連結）

CI 在 Windows-latest 矩陣（Python 3.10–3.14）跑同一套 gate。推 `main` 前先跑本機 gate。

## 依賴新鮮度

`tools/check_dependency_freshness.py` 只比對 `requirements-dev.txt`。產品套件依賴由 `package.json` 與 Dependabot 追蹤；合併前請詳閱完整 diff。

紅燈只有兩條誠實的出口：

| 出口 | 寫在哪 | 什麼時候用 |
| --- | --- | --- |
| `# freshness-hold: <理由>` | `requirements-dev.txt` 行末 | 這個下限就是我們要的 |
| `.github/dependency-deferrals.json` 的 `deferredLatest` + `reason` | 獨立檔案 | 已看過、這個月不升；PyPI 超過該版本會恢復提醒 |

不要用調高下限讓報告變綠。

## 不要做的事

- 不要拿掉工作流程中的 `github.repository == 'arcsin1/oh-my-ppt'` 相關防護（若有）。
- 不要向 `upstream` 開 PR 或 push 到 `upstream`。
- 不要提交真實 API Key、私人模型 Token、未經授權的商業簡報素材或 `.env` 檔案。
- 測試必須是合成樣本與規格檢查，不能拿真實個人敏感文件當 fixture。
