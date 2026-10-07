# 上游維護

## Remote

- Fork：`origin` → `https://github.com/SanHsien/oh-my-ppt.git`（預設分支 `main`）
- 原作者：`upstream` → `https://github.com/arcsin1/oh-my-ppt.git`（預設分支 `main`）
- 追蹤分支：`main`

## 檢查新提交

```powershell
git fetch upstream main
python tools\check_upstream_updates.py --strict
```

工具以 `tools/upstream_baseline.json` 為起點，全面追蹤四大面向：Commit SHA、Pull Requests、Issues 以及上游官方說明網站（`https://www.ohmyppt.cc` 版本與說明文件）。
有新變更或檢查失敗時，`--strict` 回傳非零；排程 workflow 也會因此明確亮紅燈提醒。

CI 沒有 `upstream` remote，所以 baseline 的 `repo` 寫完整 clone URL，不要寫遠端短名。

## 審查清冊

每次只做一次批次審查：

1. 讀 commit 主旨與變更檔案（open PR 必須讀 diff，禁止只憑標題結案）。
2. 判斷是否與繁中 README、Windows gate 或測試衝突。
3. 可直接同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
4. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`。
5. 在 `docs/DECISIONS.md` 記錄採用／略過理由。
6. 驗證完成後才把 baseline 推進到已審查的完整 40 字元 SHA 與更新 PR/Issue 水位。

Baseline 代表「已審查」，不代表「全部已合併」。

## 2026-09-12：fork 起點

本 fork 自上游 `main` `6d1b08bf3b0c91bb25c4372fa67222f40e086720`
（`feat: v2.5.0 doc`）建立。此 SHA 設為第一個 `reviewed_through`（短 SHA 為 `6d1b08b`）。
之後的上游 commit 才需要進入審查清冊。

首次審查水位：
- Commit: `6d1b08bf3b0c91bb25c4372fa67222f40e086720`
- PR: `#143`
- Issue: `#142`
