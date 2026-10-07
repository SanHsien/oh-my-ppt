# Node Agent Runtime Prompt Inventory

This document records the discovered non-Thinking model prompt builders in the agent runtime that remain intentionally inline.

| Prompt ID | Builder Function | Source Location | Description |
|---|---|---|---|
| `add-page-plan` | `planNewPage` | `src/main/generation/agent-runner.ts` | Plans a single new page addition |
| `document-image-plan` | `buildImageDocumentPlanPrompt` | `src/main/io/document-parse-handlers.ts` | Plans document structure from parsed image assets |
| `style-import-json-repair` | `retryFixJson` | `src/main/styles/import/pptx.ts` | Repairs malformed JSON output during PPTX style import |
