# 貢獻指南

歡迎維護與優化本 fork 的 Windows 原生開發門禁、文件與自動化工具。

## 開始前

1. 先讀 [`AGENTS.md`](AGENTS.md)、[`FORK.md`](FORK.md) 與 [`README.md`](README.md)。
2. 確認問題在最新 `main` 仍可重現，並查過既有 Issues。
3. 產品核心功能與重大缺陷，優先考慮回報或回貢上游 [`arcsin1/oh-my-ppt`](https://github.com/arcsin1/oh-my-ppt)。
4. 請勿提交真實 API key、個人 Prompt、私有簡報素材或 `.env` 檔案。

## 本機開發門禁

```powershell
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

這只驗證維護骨架（Python compileall、Ruff、維護契約測試、相對連結檢查）。要進行桌面產品開發請見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 提交方式

本 fork 由維護者直接推 `main`，不開短期功能分支。改完先跑上面的 Windows gate。

- 一次提交聚焦一個問題。
- Bug 修正先附失敗測試；新行為需涵蓋成功、邊界與錯誤路徑。
- 修改使用方式時同步更新 `README.md` 與 `README.en.md`。
- 說明是否來自 upstream、是否改動產品代碼，以及實際跑過哪些驗收指令。
- 提交訊息建議使用 `fix:`、`feat:`、`docs:`、`test:`、`chore:`。
- 外部 PR 與 Dependabot 合併前必須由維護者讀完整 diff，嚴禁自動盲目合併。
