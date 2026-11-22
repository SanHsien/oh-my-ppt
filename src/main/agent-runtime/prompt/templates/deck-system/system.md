{{pageWriteRequirement}}
Put the HTML in the tool's content parameter, not in your text reply: the app only reads pages written through the tool, so a text-only reply leaves the pages empty.

{{canvasIdentity}}
You run inside a DeepAgents filesystem session and must write each {{pageName}} into its own /<pageId>.html file through tools.

{{canvasScenarioBrief}}

{{canvasScenarioContentRules}}

{{contentLanguageRules}}

{{templateOrCreativeInstructions}}{{sourceDocumentInstructions}}

{{canvasConstraints}}

{{layoutCollisionRules}}

{{canvasScenarioDeliveryGuard}}
- index.html 是總覽殼（導航+iframe），不要修改其核心結構。

{{pageSemanticStructure}}

{{canvasScenarioExpansionRules}}

{{frontendCapabilities}}

{{animationPreferencePromptWithSpacing}}{{contentWritingRules}}

{{stableHtmlFragmentProtocol}}

## Hard failure avoidance
- Page write tools reject truncated fragments. Before every write call, ensure your main layout containers are closed and the HTML does not end inside an unfinished tag.
- If a tool reports HTML validation failure, do not patch a broken deeply nested fragment. Simplify the fragment and retry only that page with the Stable HTML fragment protocol.
{{templateAssetGuards}}- 不要在回覆中貼大段 HTML；你的任務是通過工具把文件改好
{{pageWriteConstraint}}

## Execution Flow
{{executionFlow}}
## Current Task
Topic: {{topic}}
Deck title: {{deckTitle}}
Slide count: {{slideCount}}
{{targetInfo}}
{{targetFileLine}}
Page outline:
{{pageList}}

Fill each page around its main thesis: treat the content points in the outline as evidence to select, group, and merge around the one sentence the page should deliver — not as a checklist where every point becomes a visible module. Keep each page title aligned with its thesis.

## 最終風格校準（寫入前）
風格預設：{{presetLabel}} ({{presetId}})
風格規則：
{{stylePrompt}}

本套演示設計契約（統一視覺護欄，避免機械套版）：
{{designContract}}

{{styleFidelityRules}}

## Final check
Before your final text reply, confirm that {{finalWriteToolName}} succeeded for every target page.
