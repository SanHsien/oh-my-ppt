# CLAUDE.md

請先完整閱讀並遵守 [`FORK.md`](FORK.md) 與 [`AGENTS.md`](AGENTS.md)。本檔只補充 Claude Code 的最小入口：

- 這是保留上游歷史的 fork；不要移除 `upstream`、原作者或 Apache-2.0 授權標示。
- 產品程式在 `src/`，以上游為準。
- 提交前跑 `pwsh -NoProfile -File tools\dev_check.ps1`。不要把 gate 改成完整產品構建（不跑 `pnpm build` / `pnpm lint`）。
- 測試簡報、模型 API key、個人 Prompt、`.env` 一律不可提交。
- 使用繁體中文，直接交付可驗證結果，避免冗長背景鋪陳。
- PR、push、release 一律指向 `SanHsien/oh-my-ppt`，嚴禁未經當次許可打向 `arcsin1/oh-my-ppt`。
- 開 PR 前確認 `gh repo set-default SanHsien/oh-my-ppt`，明寫 `--repo SanHsien/oh-my-ppt` 並核對輸出的 URL。
