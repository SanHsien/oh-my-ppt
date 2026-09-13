# 更新日誌 / Changelog

## 2026-09-04 · v2.5.0

### 中文

- 新增圖表編輯：雙擊圖表即可改數據、換圖表類型、調圖例顏色。
- 新增全新元素編輯交互：選中元素即出現懸浮工具條快捷操作，雙擊打開屬性面板精細編輯（邁入新的編輯方式階段）。
- 新增配圖描述一鍵生成：「大綱提示詞」生成插圖描述，「風格提示詞」生成匹配當前頁風格的背景圖描述，更加匹配當前頁面。
- 新增生圖廠商接入：支持gpt-image-2等生圖，可選擇的生圖服務更多、出圖質量更好，更便宜，穩定。
- 新增會話導出完整保留當前ppt的完整風格，分享給別人的演示不再丟風格。
- 新增文檔解析可取消，長文檔不用等待。
- 新增頁面生成併發設置：可在高級設置中自定義同時生成的頁面數（1-10），整體出稿更快。
- 優化一鍵配圖：根據頁面角色自動選擇焦點插圖或背景底圖，配圖完成前自動檢查版面，溢出與遮擋問題可自動修復。
- 優化新增頁面流程：新增頁面直接基於正文素材生成並追加到末尾，速度更快、內容更聚焦。
- 優化生成體驗：樣式大幅優化，生成進度按頁面卡片歸組展示，每頁狀態與日誌一目瞭然；初次生成界面更簡潔清爽。
- 優化 PPTX 導出：升級導出引擎，旋轉卡片等內容改爲原生導出，還原度更高，以及元素層級問題優化。
- 優化安裝包體積：產物壓縮與按需加載，安裝包顯著更小、啓動更快（減少20%～30%體積）。
- 優化 AI 模式響應性能與 OpenAI 系模型的兼容性。
- 修復 Word 文檔導入時標題層級識別錯誤、加粗殘留與空表頭問題，以及解析大綱更加匹配。
- 修復大綱生成對 thinking 類模型的參數兼容問題，統一一致跟一鍵創建的模式。
- 修復多處彈窗層級遮擋、會話創建頁提示卡住、圖表預覽偶發空白與公式選擇不匹配等問題。
- 修復生成時候會把【受衆和主張的信息】在 PPT 正文體現帶入生成內容中的問題。

### English

- Added chart editing: double-click a chart to edit its data, switch chart types, and adjust legend colors.
- Added a new element editing experience: selecting an element shows a floating toolbar for quick actions, and double-clicking opens the properties panel for detailed editing.
- Added one-click prompt generation: "Outline prompt" writes an illustration description, while "Style prompt" writes a background description matching the current slide's look.
- Added a new image-model provider, expanding your options with higher-quality output.
- Added full style preservation in session export, so shared decks keep their look.
- Added cancellation for document analysis, so long documents no longer keep you waiting.
- Added a page-generation concurrency setting: choose how many slides generate at once (1-10) in advanced settings for faster decks.
- Improved one-click illustration: automatically picks a focal illustration or background plate based on the slide's role, and audits the layout before finishing so overflow and overlap can self-heal.
- Improved the add-page flow: new pages generate directly from body material and append to the end — faster and more focused.
- Improved the generation experience: progress and logs are now grouped into per-slide cards with a cleaner first-run layout.
- Improved PPTX export: the upgraded engine exports rotated cards and similar content natively with higher fidelity.
- Improved the app footprint: compressed assets and lazy loading make the installer notably smaller and startup faster.
- Improved AI-mode responsiveness and compatibility with OpenAI-style models.
- Fixed heading-level, bold-residue, and empty-header issues when importing Word documents.
- Fixed thinking-parameter compatibility in outline generation.
- Fixed dialog layering issues, a stuck tooltip on the creation page, occasional blank chart previews, and formula selector mismatches.


## 2026-08-22 · v2.4.0

### 中文

- 新增全新創作流程：上傳文檔自動生成可視化大綱，可逐頁查看和編輯內容，確認無誤後再生成整套演示。
- 新增整套一鍵美化（全頁）：一次操作優化全部頁面，逐頁處理、逐頁保存，進度實時可見。
- 新增全元素旋轉：所有元素都可拖動旋轉，也可在屬性面板輸入精確角度。
- 新增對話創作網頁鏈接支持：粘貼網址即可輕量抓取網頁內容並自動整理爲大綱，網頁文章、博客也能直接用來創作演示。
- 優化所有生成和修改效率：初次生成速度大幅提升 30% 以上，更多環節接入多模態視覺能力，讓 AI 能"看懂"頁面與圖片。
- 優化生成忠實度：從大綱生成時完整保留原文內容（不自己胡編亂造），長資料不再丟內容。
- 優化 AI 修改的內容保護：對話修改、一鍵美化與換風格更嚴格保留原有文字和數據，避免內容被改丟。
- 優化失敗重試：失敗頁面帶着失敗原因重試，能定點修復的不整頁重做，成功率更高。
- 優化 PPTX 導入編輯：修復文字與矢量圖片丟失的問題，圖表、文本換行與藝術字還原更好，導入後更接近原稿。
- 優化導入風格抽取：更準更快，並直接以原稿封面作爲風格預覽圖。
- 優化模板與創意創建，內置風格全部自帶真實預覽圖，挑選更直觀。
- 修復 Windows 下部分預覽圖無法顯示的問題。
- 修復會話卡片生成用時顯示異常的問題。
- 修復編輯頁 AI 模式的異常處理問題。
- 修復重試過程中加載狀態重疊等若干問題。

### English

- Added a rebuilt creation flow: upload a document to get a visual outline, review and edit it page by page, then generate the full presentation once it looks right.
- Added whole-deck beautification: improve every slide in one action, processed and saved page by page with live progress.
- Added element rotation: rotate any element by dragging or enter an exact angle in the inspector.
- Added web link support in Chat to Create: paste a URL to lightly fetch the page content and have it organized into an outline, so web articles and blog posts can feed your presentation directly.
- Improved generation speed: first-time generation is over 30% faster, with multimodal vision added in more places so the AI can actually "see" pages and images.
- Improved source fidelity: slides generated from the outline keep the original text in full, so long documents no longer lose content.
- Improved content protection in AI edits: chat edits, beautification, and style switching preserve the original text and data more strictly.
- Improved failure retries: failed slides retry with their failure context, applying targeted fixes instead of full regeneration where possible.
- Improved PPTX import: fixed lost text and vector images, with better restoration of charts, text wrapping, and WordArt, so imported decks stay closer to the original.
- Improved style extraction on import: faster and more accurate, reusing the original cover as the style preview.
- Improved template and creative creation; all built-in styles now include real preview images for easier picking.
- Fixed preview images failing to display on Windows.
- Fixed incorrect generation durations shown on session cards.
- Fixed an exception-handling issue in the editor's AI mode.
- Fixed overlapping loading states during retries and other issues.

## 2026-08-09 · v2.3.0

### 中文

- 新增AI模式支持當前頁參考文件上傳，可將常用文檔作爲本次修改的參考（比如生成圖表等等）。
- 新增一鍵配圖：可爲頁面快速補充更合適的圖片內容。
- 優化圖片生成與配圖體驗，生成效果和使用流程更穩定。
- 優化編輯體驗：拖拽、縮放與元素位置、尺寸調整更順手。
- 優化 AI 創作與修改能力，預覽和編輯過程更流暢。
- 優化一鍵美化效果，頁面佈局與視覺表現進一步提升。
- 優化生圖模型的配置簡單化，官網也新增完整的模型配置教程
- 優化可編輯 PPTX 導出效果。
- 修復ai模式的對話響應問題。

### English

- Added reference-file uploads for AI current-page edits, so common documents can guide the requested change.
- Added one-click image matching to quickly enrich slides with suitable visuals.
- Improved image generation and illustration workflows for more reliable results and a smoother experience.
- Improved editing: dragging, resizing, and adjusting element position and size are more intuitive.
- Improved AI creation and editing, with smoother preview and editing workflows.
- Improved one-click beautification for stronger slide layouts and visual presentation.
- Improved editable PPTX export results.

## 2026-08-03 · v2.2.0

### 中文

- 新增演示母版：可爲整套演示統一設置背景、標題和正文字體，並按需覆蓋已有頁面，快速建立一致的視覺基調。
- 新增母版全局元素管理：可統一添加和調整 Logo、頁腳、頁碼與水印，也可針對單頁隱藏這些元素。
- 新增版式母版：可爲封面、數據重點、對比、時間線、流程、總結等不同內容類型預設版式，後續新增或生成頁面會更貼合預期結構。
- 新增創建時自動配圖：選擇支持生圖的風格並開啓功能後，系統會根據頁面內容自動補充插畫或背景圖；失敗頁面可單獨重試，不影響整套演示繼續生成。
- 新增 AI 風格推薦：創建演示或選擇風格時，可根據主題和內容獲得匹配的風格建議，減少篩選成本。
- 新增更多內置風格，並在風格選擇中清晰標記支持自動配圖的風格。
- 新增幫助文檔入口：可從側邊欄直接打開產品使用指南。
- 新增更多風格： 增加額外30+風格，支持配圖等。
- 優化風格創建：官方 [style-generate-skill](https://github.com/arcsin1/style-generate-skill) 支持爲風格配置配圖方向，讓使用該風格創作時的自動配圖更貼合整體視覺。
- 優化 AI 生圖體驗：可在設置中驗證生圖模型，生成時提供更合適的尺寸選擇與頁面上下文參考，配圖更容易融入當前頁面。
- 優化一鍵美化：一鍵美化當前頁面，在保留原有信息的同時優化頁面的版式與視覺層次，效果極佳。
- 優化編輯體驗：PPT 與網頁編輯器中的元素選擇、拖拽、縮放和屬性調整更準確，複雜頁面中的手動精修更順手。
- 優化網頁編輯：可繼續編輯帶有單頁動畫、切頁或滾動效果的網頁，並更好地保留當前頁面狀態。
- 優化 PPTX 導入與導出：進一步改善形狀、字體、背景和動畫等內容的還原；支持以 4:3 比例導出可編輯 PPTX。
- 優化 AI 修改流程：整套和指定頁面的修改範圍、進度反饋、取消與重試更清晰，避免無關頁面受到影響。
- 優化 Windows 頂部工具欄，窗口操作更貼合桌面使用習慣。
- 修復主會話的進度展示與頁面意圖識別問題，AI 修改過程更穩定、反饋更準確。

### English

- Added Presentation Masters: set a shared background plus title and body fonts for an entire deck, then apply the visual direction across existing slides when needed.
- Added Global Elements: manage shared logos, footers, page numbers, and watermarks in one place, with the option to hide them on individual slides.
- Added Layout Masters: preset layouts for covers, data highlights, comparisons, timelines, processes, summaries, and more, so newly generated slides better match their intended structure.
- Added automatic illustrations during creation: choose an image-enabled style and turn the feature on to add context-aware illustrations or backgrounds as slides are generated. Failed illustrations can be retried without interrupting the deck.
- Added AI style recommendations: get matching style suggestions from your topic and content when creating a presentation or choosing a style.
- Added more built-in styles, with clear indicators for styles that support automatic illustrations.
- Added a Help Docs entry to the sidebar for direct access to the product guide.
- Improved style creation: the official [style-generate-skill](https://github.com/arcsin1/style-generate-skill) can now define illustration direction for a style, making automatic visuals better match the overall design.
- Improved AI image generation: verify image models from Settings, choose more suitable sizes, and generate with richer page context so visuals fit the current slide more naturally.
- Improved one-click beautification: choose visual or structure-focused refinement to improve layout and hierarchy while retaining the original information.
- Improved editing precision: selecting, dragging, resizing, and adjusting properties is more reliable in both the presentation and HTML editors, especially on complex pages.
- Improved HTML editing: continue editing pages with slide transitions, single-page animations, or scrolling effects while preserving the current page state more reliably.
- Improved PPTX import and export: better restoration of shapes, fonts, backgrounds, and animations, plus editable PPTX export in 4:3 format.
- Improved AI editing workflows: scope, progress, cancellation, and retries are clearer for full-deck and selected-slide changes, helping keep unrelated slides untouched.
- Improved the Windows title bar with desktop-friendly window controls.
- Fixed main-session progress reporting and page-intent recognition, making AI editing feedback more reliable.

## 2026-07-24 · v2.1.0

### 中文

- 新增 HTML 編輯功能：導入單HTML 文件後可在應用內直接編輯，保存，支持 AI 修改、素材添加、歷史管理、預覽和導出。
- 新增編輯頁一鍵頁面美化：自動優化當前頁面的版式和視覺效果，同時保留原有文字與數據。
- 優化 PPTX 導入：升級獨立的 `@arcsin1/pptx2json` 包，導入後的內容更接近原稿，也更方便繼續編輯，大幅度優化導入效果，覆蓋更多能力。
- 優化可編輯 PPTX 導出：升級獨立的 `@arcsin1/html2pptx` 包，導出的文件更接近應用內的效果，大幅度優化導出效果，覆蓋更多能力。
- 大幅優化整套風格切換交互：支持後臺處理，切換過程中可繼續使用應用，並可查看進度和重試失敗頁面，在後臺獨立運行。
- 大幅優化新增內容頁交互：輸入頁面需求後可在後臺生成新頁面，沿用現有風格，生成狀態和結果更清晰，在後臺獨立運行。
- 大幅優化編輯任務和界面反饋：頁面修改與 PPTX 導出更穩定，會話、模板和用量查看更清晰，可重試，可中斷，在後臺獨立運行。
- 大幅優化ai模式的交互：升級爲更智能的ai對話，完全後臺獨立運行，執行中，可重試，可中斷，在後臺獨立運行。
- 修復 Windows 本地資源加載問題。
- 修復文字顏色修改後點擊編輯區外會恢復的問題。

### English

- Added HTML editing: import HTML files and continue working on them in the app with AI edits, media insertion, history, preview, and export.
- Added one-click slide beautification: automatically improve the current slide's layout and visual quality while keeping its text and data unchanged.
- Improved PPTX import: upgraded the standalone `@arcsin1/pptx2json` package so imported content stays closer to the original and is easier to continue editing.
- Improved editable PPTX export: upgraded the standalone `@arcsin1/html2pptx` package so exported files more closely match the in-app result.
- Significantly improved full-deck style switching: it now runs in the background, so you can keep using the app while tracking progress and retrying failed slides.
- Significantly improved content-slide creation: describe the page you need and generate it in the background using the presentation's existing style, with clearer progress and results.
- Improved editing reliability and interface feedback: page edits and PPTX export are more stable, while Sessions, Templates, and Token Usage are clearer to manage.
- Fixed Windows local-resource loading issues.
- Fixed an issue where text color changes could revert after clicking outside the editing area.

## 2026-07-12 · v2.0.20

### 中文

- 新增編輯頁形狀與圖標插入：可直接添加矩形、圓角矩形、圓形、線條、箭頭、三角形、菱形、星形等常用形狀，以及圖標和編號元素，做結構標註、流程圖和重點提示更方便。
- 新增公式插入：編輯時可從工具欄快速添加 LaTeX 公式，並繼續在右側面板修改內容、展示方式和預覽效果。
- 新增可編輯圖表：支持插入柱狀圖、折線圖、餅圖、環形圖和雷達圖，可調整標題、數據、顏色、圖例、堆疊、橫向顯示、平滑曲線和麪積填充等設置。
- 新增圖表數據導入：圖表編輯面板支持導入 CSV、TSV、JSON 和 Excel 數據，分類列與數值列會自動整理爲可編輯圖表數據。
- 新增元素應用到所有頁面：選中一個元素後可同步到整套演示，適合統一頁眉頁腳、Logo、角標、版權信息或固定裝飾元素。
- 新增從模板添加頁面：可在當前演示中選擇模板頁面並複製到末尾，保留模板原始頁面風格，方便快速補頁和複用版式。
- 新增複製頁面：可直接複製當前頁面並插入到原頁之後，複製後保留頁面內容、素材引用和編輯結構。
- 新增 PNG 長圖導出：可將整套演示縱向拼接爲一張長圖，適合社媒發佈、聊天分享和長文檔預覽。
- 新增升級可編輯 PPTX 導入底座：開源並重寫了底層 PPTX 可編輯導入包（`@arcsin1/pptx2json`）的實現，新的解析鏈路改進形狀、表格、圖表、圖片、文本層級和動畫信息還原，導入後更接近原稿並更容易繼續編輯（適用於所有pptx文件）。
- 優化 PPTX 導入進度：導入階段會展示解析、寫入會話、抽取風格和完成狀態，長文件導入時等待感更清晰。
- 優化運行時播放與預覽：刷新圖表渲染和導入頁面運行時資源，提升瀏覽、演示和導入頁面回放的一致性。

### English

- Added shape and icon insertion in the editor: insert common shapes such as rectangles, rounded rectangles, ellipses, lines, arrows, triangles, diamonds, stars, plus icon and number elements for diagrams, annotations, and highlights.
- Added formula insertion: add a LaTeX formula from the toolbar, then continue editing its content, display mode, and preview from the inspector.
- Added editable charts: insert bar, line, pie, doughnut, and radar charts, then adjust titles, data, colors, legends, stacking, horizontal layout, smooth lines, and area fills.
- Added chart data import: the chart inspector can import CSV, TSV, JSON, and Excel data, mapping category and numeric columns into editable chart data.
- Added apply element to all pages: sync a selected element across the full deck, useful for headers, footers, logos, badges, copyright notes, and fixed decoration.
- Added pages from templates: choose pages from a template and copy them to the end of the current presentation while preserving the template's original page style.
- Added page duplication: duplicate the current page directly after the source page while preserving content, asset references, and editable structure.
- Added PNG long image export: stitch the full deck vertically into one long image for social posts, chat sharing, and long-document previews.
- Major upgrade to the editable PPTX import foundation: the underlying editable PPTX import package (`@arcsin1/pptx2json`) has been open-sourced and rewritten, with a new parser that improves restoration of shapes, tables, charts, images, text layering, and animation metadata so imported decks stay closer to the original and remain easier to edit.
- Improved PPTX import progress: import now reports parsing, session writing, style extraction, and completion states, making long imports easier to follow.
- Improved runtime playback and previews: refreshed chart rendering and imported-page runtime assets make browsing, presenting, and imported slide playback more consistent.

## 2026-07-06 · v2.0.19

### 中文

- 新增多尺寸創作：一套工具覆蓋橫屏演示、豎版長圖、4:3 投屏、方圖和小紅書等多種場景，會話、模板、預覽、導出全程保留真實比例，不再被拉伸裁切。
- 新增內置技能更貼近實際場景：多尺寸佈局和圖表生成規則更完整，模型調用更穩定，生成結果更少跑偏。
- 優化PPTX 導入更接近原稿：改進形狀還原和顏色層級，減少圓形變橢圓、膠囊失真、文字偏位等問題。
- 優化長文檔生成帶章節結構：自動爲適合的章節生成”本章概覽”過渡頁，長資料不再是逐頁平鋪，而是有節奏、有結構的演示敘事。
- 優化 Windows 頂部拖拽也更順手。
- 修復編輯保存與交互細節：移動、改字、調整元素後更可靠地進入待保存狀態，風格切換進度更清晰。

### English

- Multi-format canvas: create widescreen decks, vertical scrolls, 4:3 slides, square cards, and posters from one workspace — sessions, templates, previews, and exports keep the true proportions throughout.
- Long Markdown sources become structured decks: section hierarchy is recognized on import, and suitable chapters automatically get “chapter overview” transition pages, turning long material into a paced, readable presentation.
- PPTX import is closer to the original: improved shape fidelity and color/layer accuracy, reducing ovalized circles, distorted pills, and shifted text.
- Built-in skills are more production-ready: richer multi-format layout and chart guidance, with more stable model calls and fewer generation drifts.
- Fixed edit-save states and interaction details: moving, editing, or resizing elements now reliably triggers save state; style-switching progress is clearer; Windows toolbar dragging is smoother.

## 2026-06-28 · v2.0.18

### 中文

- 新增創建時動畫風格選擇（可選）：生成演示前可以先選擇喜歡的動效動畫方向，讓整套演示從一開始就更接近想要的講述節奏。
- 新增編輯頁[動畫]單個元素動畫設置：編輯時可直接給文字、圖片、圖表等元素添加入場、強調或退出效果，適合做重點突出和逐步講解。
- 新增數學公式編輯：選中公式後可直接修改內容、切換展示方式並實時預覽，理工、金融、教育類演示更容易精修。
- 新增風格收藏：常用風格可以收藏，創建演示或切換風格時更快找到自己反覆使用的視覺方案。
- 新增風格搜索：風格庫和創建頁風格選擇器都支持搜索與場景篩選，面對大量風格時不用再一點點翻。
- 新增 Seedream 生圖支持：圖片生成可使用 Seedream，給需要配圖、背景圖和創意視覺的頁面多一個選擇。
- 新增更多模型兼容選項（thinking）：設置模型時可以更靈活地適配不同服務，減少“配置看起來沒問題但實際無法調用”的情況。
- 新增了更多的內置動畫：更多的動畫內置，以及配置友好，單元素也可以配置不同動畫。
- 修復【對話創作】偶發中斷：AI 整理需求或生成大綱時，即使模型返回的內容結構略有差異，也會自動校正並繼續處理，減少因格式不一致導致的失敗(deepseek)。
- 優化【對話創作】上下文連續性：更新主題、確認事項和待解決問題時會保留未改動的信息，減少多輪溝通中需求或決定意外丟失。
- 優化手動編輯保存體驗：移動、縮放、改字、刪元素等操作會更清楚地進入待保存狀態，切換頁面前也會提醒，減少辛苦調整後丟失修改。
- 優化【編輯頁】頁面管理體驗：頁面排序、重命名、刪除、單頁導出和大綱導出更順手，側欄和瀏覽模式裏的頁面切換也更穩定。
- 優化風格查找體驗：風格按適用場景重新整理，收藏、搜索和篩選結果更符合實際使用習慣。
- 優化【生成過程】後臺生成體驗：最小化應用後不會再被單頁預覽反覆喚起，僅在整套演示生成完成或失敗時恢復窗口提醒。
- 優化頁面可讀性：新生成頁面會減少過小文字，標題、正文和註釋更適合直接投屏或分享（正文最小18px，註釋等不低於12px）。
- 優化元素選中和拖拽：複雜頁面裏選中文字、公式、圖片和重疊元素更準確，拖拽對齊時也更不容易偏。
- 優化編輯歷史穩定性：撤銷、重做、歷史回滾和繼續編輯更穩，複雜會話裏反覆調整更安心。
- 增強 PPTX 動畫保留效果：導入和導出時能更好保留常見動畫，導出的可編輯 PPTX 在 PowerPoint/WPS 中播放更接近應用內效果。
- 增強圖表頁生成質量：圖表會獲得更合理的展示空間，旁邊的結論、註釋和指標也更剋制，減少“圖太小、卡片太多、重點不清”的頁面。
- 增強複雜內容排版能力：生成時會更重視頁面主次、信息密度和閱讀路徑，長內容更容易被整理成適合演示的結構（更關注內容密度來決定排版）。
- 增強動畫生成質量：AI 生成的動畫更貼近演示場景，減少看起來熱鬧但不利於講述或導出後表現不一致的動畫。

### English

- Added optional animation style choices during creation: pick the motion direction you want before generation so the whole deck starts closer to the pacing you have in mind.
- Added per-element animation controls: add entrance, emphasis, or exit effects directly to text, images, charts, and other slide elements in the editor — ideal for highlighting key points and walking through content step by step.
- Added formula editing: select a formula to revise its content, switch display style, and preview the result instantly, making it easier to fine-tune technical, finance, and education decks.
- Added style favorites: save frequently used styles and find them faster when creating a deck or switching styles.
- Added style search: both the style library and the creation-flow style picker now support search and scenario filtering, so you no longer have to scroll through large collections one by one.
- Added Seedream image generation support: use Seedream for slide visuals, backgrounds, and creative imagery, giving image-heavy pages one more option.
- Added more flexible model compatibility options (thinking): model setup adapts to more services, reducing cases where a config looks fine but actually fails to call.
- Added more built-in animations: more animations are now built in, with friendlier configuration.
- Fixed occasional interruptions in Chat to Create: when AI organizes requirements or builds an outline, minor structural differences in model responses (deepseek) are corrected automatically instead of stopping the workflow.
- Improved Chat to Create context continuity: when updating topics, confirmed decisions, or open questions, unchanged information is preserved, reducing accidental loss of requirements or decisions across multi-turn planning.
- Improved manual edit saving: moves, resizes, text changes, and deleted elements are now more clearly marked as pending work, and page switching reminds you to save — reducing the chance of losing careful adjustments.
- Improved page management in the editor: sorting, renaming, deleting, single-slide export, and outline export feel smoother, and page switching in the sidebar and browse mode is more stable.
- Improved style discovery: styles are reorganized by use case, so favorites, search, and filter results better match real creation habits.
- Improved background generation: minimizing the app no longer lets individual slide previews repeatedly bring it forward; the window returns only when the full deck completes or fails.
- Improved slide readability: newly generated pages avoid overly small text, making titles, body copy, and notes easier to present or share (body text minimum 18px, notes no smaller than 12px).
- Improved element selection and dragging: text, formulas, images, and overlapping elements are easier to target accurately on complex slides, and alignment while dragging is less likely to drift.
- Improved editing reliability: undo, redo, history rollback, and continued editing are steadier, making repeated adjustments in complex sessions more reassuring.
- Enhanced PPTX animation preservation: common animations are better retained on import and export, so editable PPTX files play closer to the in-app experience in PowerPoint / WPS.
- Enhanced chart-slide quality: charts get more appropriate space, while nearby conclusions, notes, and metrics stay more restrained — reducing slides where the chart is too small, there are too many cards, and the main point is unclear.
- Enhanced complex-content layout: generation pays more attention to hierarchy, information density, and reading flow, turning long material into more presentation-ready structures (layout is now decided more by content density).
- Enhanced animation quality: generated animations are more presentation-oriented, reducing flashy effects that distract from the message or behave inconsistently after export.

## 2026-06-16 · v2.0.17

### 中文

- 新增跨會話添加頁面：編輯時可從其他已有會話中選擇頁面複製到當前演示末尾，適合複用歷史內容、合併方案或快速拼接多份稿件。
- 新增主會話頁面範圍選擇：對整套演示發起 AI 修改時，可選擇全部頁面或指定頁面範圍，避免一次改動影響不相關頁面。
- 新增批量編輯進度面板：整套/多頁修改會實時展示每頁處理狀態、失敗原因和完成結果，失敗頁面可單獨重試。
- 新增整套風格切換：可在編輯工作臺中選擇新風格並重繪整套演示，儘量保留原有文字、數據和頁面含義，同時重新設計視覺佈局。
- 新增編輯標尺、網格與輔助線：編輯畫布支持吸附、參考線和標尺定位，拖拽排版、對齊元素和統一頁面結構更方便。
- 新增會話搜索：會話列表支持按標題搜索，歷史演示較多時更容易定位目標會話。
- 新增會話與模板封面縮略圖生成：會話列表、模板卡片和風格預覽的封面加載更完整，並支持縮略圖缺失時自動補全。
- 新增 Token 用量統計：設置中可查看模型調用次數、輸入/輸出 Token、按天趨勢、當天小時趨勢和不同模型的用量分佈（僅供參考）。
- 新增 OpenAI Responses Provider：基礎模型配置可選擇 OpenAI Responses 接口，兼容新的 OpenAI 調用鏈路。
- 新增 Linux 打包配置，可自行打包
- 新增風格包導入導出：支持導入風格 ZIP 或風格文件夾，也可將單個風格導出爲 ZIP；風格頁新增場景篩選、刪除確認和官方風格解析 Skill 入口。
- 增強PPTX 導入：進一步改進表格、圖表和頁面結構解析，導入後的頁面更容易繼續編輯、生成縮略圖和複用爲風格。
- 重構：風格系統內置風格從 30+ 擴展到 70+，風格資源改爲獨立文件夾結構，風格生成skill用：官方技能包[https://github.com/arcsin1/style-generate-skill]。
- 優化 OpenAI 兼容模型參數處理：官方 OpenAI 端點不再攜帶非標準 `thinking` 參數，其他兼容端點仍會按需關閉 thinking，減少 `400 Unknown parameter` 和推理字段兼容問題。
- 優化所有頁面的ui風格：所有頁面都ui增強，支持預覽縮略圖以及交互增強。
- 優化頁面生成與修改摘要：生成完成說明會基於已驗證頁面數據構建，編輯摘要會隔離模型原始輸出，減少完成提示與實際頁面狀態不一致的問題。
- 優化會話列表 UI 與長列表渲染：頁面縮略圖按需加載，列表滾動和大量會話展示更順暢，性能增強。

### English

- Added pages from another session: select slides from an existing session and copy them to the end of the current deck, making it easier to reuse previous work, merge proposals, or assemble decks quickly.
- Added page range selection for main-session AI edits: apply deck-level instructions to all slides or only selected slides, reducing accidental changes to unrelated pages.
- Added a batch edit progress panel: track the status, failure reason, and final result for each slide during whole-deck or multi-slide edits, with retry support for failed slides.
- Added full-deck style switching: choose a new style in the editor and redraw the whole presentation while keeping the original text, data, and slide meaning as much as possible.
- Added editor rulers, grids, and guides: snapping and reference lines make alignment, layout, and consistent slide structure easier.
- Added session search: search session titles from the session list to find older decks faster.
- Added cover thumbnail generation for sessions and templates: session lists, template cards, and style previews now show covers more completely, and missing thumbnails can be filled automatically.
- Added token usage statistics: view model call counts, input/output tokens, daily trends, today's hourly usage, and usage distribution by model from Settings.
- Added OpenAI Responses Provider: base model configuration can now choose the OpenAI Responses interface.
- Added Linux packaging configuration, so Linux builds can be packaged manually.
- Improved OpenAI-compatible model handling: official OpenAI endpoints no longer receive unsupported `thinking` parameters, while compatible endpoints still request thinking to be disabled when needed, reducing related configuration and call failures.
- Reworked the style system: built-in styles expanded from 30+ to 70+, with a new style resource structure. Use the official style generation skill at [https://github.com/arcsin1/style-generate-skill].
- Added style package import/export: import style ZIPs or style folders, export individual styles as ZIP files, filter styles by use case, confirm deletion, and open the official style parser skill from the Styles page.
- Improved the UI style across all pages: every page has enhanced visuals, preview thumbnails, and interaction details.
- Enhanced PPTX import: tables, charts, and slide structure are parsed more accurately, making imported slides easier to edit, thumbnail, and reuse as styles.
- Improved generation and edit summaries: completion messages are now based on confirmed slide results, and edit summaries avoid exposing raw model output, reducing mismatch between messages and actual slide state.
- Improved the Sessions page and long-list performance: slide thumbnails load as needed, scrolling through many sessions is smoother, and overall performance is better.

## 2026-06-11 · v2.0.16

### 中文

- 新增 MP4 視頻導出功能：可將整套演示導出爲視頻文件，適合分享、歸檔或在不方便播放 PPT 的場景中直接使用。
- 新增頁面切換動畫：支持淡入、滑動、推進、擦除、縮放、翻轉、立方體、封面流、模糊、聚焦展開等多種切頁效果，演示節奏更接近正式放映（只在瀏覽器打開和演示模式有效）。
- 新增鼠標滾輪翻頁：演示和瀏覽時可使用鼠標滾輪切換頁面，翻頁手感更自然，並減少連續滾動導致的誤觸。
- 新增導出進度提示：PPTX、圖片和視頻導出過程中會顯示實時進度、當前階段和完成結果，長文件導出時更安心。
- 增強 PPTX 導出質量：導出的可編輯 PPTX 對文字、圖片、圖表、表格、動畫和頁面結構的還原更穩定，複雜頁面在 PowerPoint 和 WPS 中的表現更可靠（因爲沒有大量測試模版，不能做到100%還原，大概80%-95%效果）。
- 增強 PPTX 導出速度：長演示和複雜頁面的導出等待時間減少，批量導出體驗更順暢。
- 增強 PPTX 導入：導入已有 PPTX 時可更好識別圖表、表格和頁面內容，導入後的頁面更容易繼續編輯和複用。
- 優化頁面畫布：生成頁與預覽頁減少默認邊距幹擾，頁面更接近真正的全屏幻燈片效果，背景和主體內容的邊界更一致。
- 優化生成佈局質量：AI 會先根據內容密度選擇合適的版式，再進行寬高自檢，減少內容超出畫布、上下堆疊和卡片過密的問題，同時保留更自由的創意佈局。
- 優化圖表頁面生成：圖表頁會更明確地區分主圖表、輔助信息和註釋，減少圖表過高、信息區擠壓或多行卡片堆疊的問題。
- 優化大綱與資料生成：當用戶明確列出多個要點時，頁面規劃會更完整地保留這些重點，減少漏點、合併不當或結構偏移。
- 優化生成完成提醒：生成任務通知更清晰，完成、失敗和部分完成狀態更容易識別。
- 修復思考文檔刷新異常：部分場景下思考內容不及時更新的問題已改善。

### English

- Added MP4 video export: export an entire presentation as a video for sharing, archiving, or playback when a PPT file is not the best fit.
- Added slide transitions: choose from fade, slide, push, wipe, zoom, flip, cube, cover flow, blur, iris, swing, and center reveal for a more presentation-ready rhythm.
- Added mouse wheel navigation: move between slides with the mouse wheel while browsing or presenting, with smoother control and fewer accidental jumps.
- Added export progress feedback: PPTX, image, and video exports now show live progress, the current stage, and the final result, making long exports easier to follow.
- Improved PPTX export quality: editable PPTX files now preserve text, images, charts, tables, animations, and slide structure more reliably, with better results in PowerPoint and WPS.
- Improved PPTX export speed: long presentations and complex slides now export with less waiting, making batch export smoother.
- Improved PPTX import: existing PPTX files now restore charts, tables, and slide content more accurately, so imported slides are easier to edit and reuse.
- Improved the slide canvas: generated and previewed slides now feel closer to true full-screen slides, with less default spacing around the canvas.
- Improved generated layout quality: AI now chooses layouts based on content density and checks width and height before writing, reducing overflow, vertical stacking, and overcrowded cards while keeping layouts more creative.
- Improved chart slide generation: chart pages now better separate the main chart, supporting information, and notes, reducing oversized charts, squeezed content, and stacked support cards.
- Improved outline and source-based generation: when users provide explicit points, slide planning preserves them more completely and reduces missing points, unwanted merging, or structural drift.
- Improved generation completion notifications: task updates are clearer, making completed, failed, and partially completed states easier to recognize.
- Fixed thinking document refresh issues in some sessions.

## 2026-06-07 · v2.0.15

### 中文

- 新增多任務生成：創建演示會話後可繼續發起其他任務，無需停留在生成頁面等待；會話列表會持續展示排隊、生成進度和完成狀態。
- 新增應用內任務通知：生成完成、部分完成或失敗時會在應用內及時提醒，並可直接進入對應會話查看結果。
- 新增會話另存爲：可複製當前演示的頁面與素材創建獨立新會話，適合保留原稿後繼續製作不同版本。
- 新增瀏覽模式：在編輯工作臺中以更純淨的方式連續查看整套演示，編輯、瀏覽和演示等使用場景切換更清晰。
- 新增藝術字：編輯頁面可直接插入藝術字，並可以調整文案、效果和字號，標題與重點內容的視覺表現更豐富。
- 新增模型兼容性設置：基礎模型配置支持關閉 `temperature` 參數，兼容不接受該參數的模型服務。
- 新增對話創作大綱編輯：可在生成前手動修改每頁的標題、頁面目標、內容摘要和關鍵要點，後續對話與生成會使用更新後的大綱。
- 大幅增強資料理解與大綱解析：上傳 Markdown、文本、CSV、DOCX 或圖片後，可更準確地提煉章節、關鍵結論、數據和頁面結構，讓生成內容更貼近原始資料。
- 增強對話創作：AI 能更持續地整理上傳資料、創作目標和頁面規劃，在生成前形成更清晰、可調整的內容方案。
- 增強 PPTX 導入：支持更好地還原表格、圖表、頁面大綱和動畫信息，複雜演示導入後的可編輯性與結構完整度進一步提升。
- 優化多模型任務執行：不同任務可分別選擇運行模型，支持使用多個模型處理生成、編輯、模板複用、文檔解析和演講稿等任務。
- 優化編輯工作臺：重新組織頂部工具、頁面導航、AI、生圖、屬性、演講稿和歷史記錄等功能，常用操作更集中，編輯狀態更清晰。
- 優化編輯歷史：撤銷、重做和頁面編輯記錄更穩定，複雜編輯過程中的回退與恢復更可靠。
- 優化大文件與長演示支持：演示頁數上限提升至 500 頁，PPTX 上傳大小上限提升至 500MB。
- 優化縮略圖加載：長演示的頁面縮略圖按需加載，進入編輯頁和滾動頁面列表時更流暢。
- 優化模板創建與複用：文檔解析建議、模型選擇和生成參數確認更集中，使用模板創建新內容時更直觀。
- 修復 macOS Apple Silicon 環境下部分會話包無法正常打開的問題。

### English

- Added multi-task generation: start another presentation while existing tasks continue in the background, with queued, generating, and completed states visible from the Sessions page.
- Added in-app task notifications: receive a notification when generation completes, partially completes, or fails, then open the related session directly.
- Added Save as New Session: duplicate the current slides and assets into an independent session, making it easier to preserve the original while creating variations.
- Added Browse mode: review the full presentation in a cleaner workspace, with clearer transitions between editing, browsing, and presenting.
- Added WordArt: insert stylized text directly in the editor and adjust its content, effect, and size for more expressive titles and highlights.
- Added a model compatibility option: Base Model Configuration can omit the `temperature` parameter for services that do not support it.
- Added outline editing in Chat to Create: revise each slide's title, objective, summary, and key points before generation; later conversations and generation use the updated outline.
- Significantly improved source understanding and outline parsing: Markdown, text, CSV, DOCX, and image uploads are now better organized into chapters, key findings, data points, and slide structures.
- Enhanced Chat to Create: AI now maintains a clearer understanding of uploaded sources, creative goals, and slide plans before turning them into a generation-ready outline.
- Enhanced PPTX import: tables, charts, slide outlines, and animation metadata are restored more accurately for better editability and structural fidelity.
- Improved multi-model task execution: different tasks can use different models for generation, editing, template reuse, document parsing, speaker scripts, and more.
- Improved the editing workspace: reorganized tools for page navigation, AI, image generation, properties, speaker scripts, and history so common actions are easier to find and current modes are clearer.
- Improved edit history: undo, redo, and slide edit records are more reliable during longer or more complex editing sessions.
- Improved support for large files and long presentations: presentations can now contain up to 500 slides, and PPTX uploads can be up to 500MB.
- Improved thumbnail loading: slide thumbnails are loaded on demand for smoother entry and scrolling in long presentations.
- Improved template creation and reuse: document suggestions, model selection, and generation settings are now presented in a more focused workflow.
- Fixed an issue that could prevent some session packages from opening on Apple Silicon Macs.

## 2026-06-02 · v2.0.14

### 中文

- 新增 AI 生圖工作流：編輯頁右側新增圖片生成模式，可圍繞當前頁面生成配圖素材，並支持將生成圖片添加到畫布、設置爲頁面背景或直接定位本地文件。
- 新增多生圖模型接入配置：目前支持即夢、Agnes AI、硅基流動、OpenAI-compatible 圖片接口和 Gemini 圖片生成，並可在設置頁獨立管理、啓用和驗證生圖模型。
- 新增配圖提示詞輔助：支持「大綱提示詞」和「風格提示詞」，可根據當前頁標題、大綱、頁面視覺風格和用戶輸入生成更適合當前頁面的配圖描述；
- 新增統一模型切換體驗：創建、模板複用、風格導入、圖片解析等需要模型參與的操作，都可以在執行前選擇本次使用的模型，減少頻繁進入設置頁切換的成本，多模型切換更方便。
- 新增頁面大綱：編輯頁支持讀取、展示和編輯修改頁面大綱，創建、導入、頁面管理和單頁補寫流程中的頁面上下文更清晰。
- 新增 HTTP/SOCKS 代理支持：可爲模型服務配置代理，提升訪問 Gemini 等外部服務時的網絡兼容性。
- 新增 macOS Intel 架構支持配置，提升 Apple Silicon 與 Intel Mac 的安裝包兼容性。
- 優化對話創作： 增加對話歷史記錄，用戶可以查看和管理之前的對話記錄，方便後續參考和繼續創作。
- 優化設置頁：增加一些配置幫助說明。
- 優化模板複用體驗：從模板創建演示時的參數確認、模型選擇和生成前校驗更完整，減少模板結構異常導致的失敗。
- 優化導入與解析穩定性：文檔解析、大綱歸一化、PPTX 導入和風格抽取流程更穩，對複雜輸入的容錯更好。
- 新增添加文字功能：編輯頁可直接添加文字元素，文字編輯體驗進一步優化。
- 優化編輯體驗：改進文字選中、字體編輯、圖層檢查和元素錨點定位，減少重疊元素或複雜頁面中的誤選和編輯偏差。
- 優化技能提示詞：更新圖表與佈局技能說明，生成圖表、版式和頁面結構時更貼合演示文稿場景。

### English

- Added AI image generation: create slide visuals from the editor, then add them to the canvas, set them as the slide background, or reveal the generated file locally.
- Added image model configuration: connect Jimeng, Agnes AI, SiliconFlow, OpenAI-compatible image APIs, and Gemini image generation from Settings.
- Added image prompt helpers: use "Outline prompt" and "Style prompt" to turn the current slide outline, visual style, and your own idea into a better image description.
- Added model selection at run time: choose which model to use before creation, template reuse, style import, image parsing, and other AI-powered actions.
- Added slide outlines: the editor can now read, display, and edit slide outlines, making the current slide context clearer during editing, import, page management, and single-slide regeneration.
- Added HTTP/SOCKS proxy support: configure a proxy for model services to improve connectivity with external providers such as Gemini.
- Added macOS Intel support: packaging configuration now better supports both Apple Silicon and Intel Macs.
- Improved chat-to-create: conversation history is now easier to keep, review, and continue from during creative planning.
- Improved Settings: added helpful configuration guidance.
- Improved template reuse: stronger parameter confirmation, model selection, and pre-generation checks reduce failures from invalid template structure.
- Improved import and parsing stability: document parsing, outline normalization, PPTX import, and style extraction now handle complex inputs more reliably.
- Added text insertion: add text elements directly in the editor, with further improvements to text editing.
- Improved editing: text selection, font editing, layer inspection, and element anchoring are more accurate on complex or overlapping slide elements.
- Improved built-in skill prompts: chart and layout instructions now better match presentation-generation scenarios.

## 2026-05-29 · v2.0.13

### 中文

- 新增動畫效果增強：生成頁面時支持更豐富的入場動畫效果，包括淡入、飛入、擦除、縮放、旋轉等，並支持逐條出現和交錯展示，演示內容可按講述節奏逐步展開。
- 新增 PPTX 動畫導出：導出可編輯 PPTX 時保留動畫效果和頁面切換轉場，導出後可在 PowerPoint或者wps中直接演示播放。
- 新增 PPTX 動畫導入：導入 PPTX 時自動解析並還原原稿的動畫效果，無需手動重新設置。
- 新增富文本編輯：編輯文字時可使用加粗、斜體、下劃線、顏色和字號等格式，編輯體驗更接近專業文檔工具。
- 優化元素選中精度：點擊重疊或嵌套元素時能更精準地定位到目標文字，不再被上層元素遮擋或誤選。
- 優化生成質量：頁面佈局、圖表和動畫的生成效果更穩定，版式更合理、圖表更準確、動畫更自然。
- 優化更新提醒：新版本通知改爲彈窗，可查看版本對比、選擇下載方式和查看更新日誌。
- 優化創建防重複提交：創建演示稿時防止重複點擊導致創建多個會話。

### English

- Added animation enhancements: generated slides now support richer entrance animations including fade, fly-in, wipe, zoom, and spin, with staggered reveals and click-by-click display so content unfolds with the speaker's rhythm.
- Added PPTX animation export: exported editable PPTX files now preserve animation effects and slide transitions, playable directly in PowerPoint.
- Added PPTX animation import: imported PPTX files now automatically parse and restore the original animation effects, no manual setup needed.
- Added rich text editing: edit text with bold, italic, underline, color, and font size formatting for a more professional editing experience.
- Improved element selection precision: clicking overlapping or nested elements now accurately targets the intended text, no longer blocked or misdirected by upper-layer elements.
- Improved generation quality: slide layout, charts, and animations are more stable and accurate with better composition and more natural motion.
- Improved update notification: new version alerts now appear as a dialog with version comparison, download options, and changelog link.
- Improved session creation guard: prevents duplicate sessions from accidental double-clicks.

## 2026-05-27 · v2.0.12

### 中文

- 新增模板庫：支持將已生成或已編輯的演示保存爲模板，管理模板名稱、描述和標籤，並在模板頁統一預覽、編輯、刪除和複用。
- 新增從模板創建ppt會話：可直接複用模板生成可編輯會話，也可輸入新主題/大綱或上傳文檔解析後，沿用模板視覺系統重新生成內容。
- 新增 PPTX 文件可導入爲模板：模板頁可導入 `.pptx` 作爲模板，自動解析頁面、抽取視覺風格並生成模板設計契約。
- 新增頁面標題編輯：編輯頁支持修改單頁標題。
- 新增空白頁創建：可選擇已有頁面作爲版式基礎創建到末尾，並自動清空可見文字，適合快速延展同風格頁面。
- 優化首頁 PPTX 快速導入編輯入口：首頁可直接導入 `.pptx` 創建可編輯會話，並展示導入進度和提示信息。
- 優化編輯/檢選體驗：進入編輯和 AI 檢選時會結束殘留動畫，避免帶動畫頁面出現元素隱藏、停在半透明狀態或無法選中的問題。
- 優化視頻元素編輯與播放：可以對視頻元素進行編輯，包括調整播放速度、音量、循環播放、自動播放等。
- 優化導入與運行時穩定性：會話導入更好地兼容扁平 ZIP 和複雜壓縮包，導入會話補齊默認設計契約；
- 修復圖表問題：圖表類目軸bug、橫向柱狀圖 tooltip 和 0 值數據展示更準確。
- 修復頁面管理問題：修復頁面管理時的動畫問題，避免頁面切換時元素隱藏、停在半透明狀態或無法選中的問題。

### English

- Added Template Library: save generated or edited presentations as templates, manage template names, descriptions, and tags, then preview, edit, delete, and reuse them from the Templates page.
- Added PPT session creation from templates: reuse a template to create an editable session directly, or enter a new topic/outline or upload a document to regenerate content while keeping the template's visual system.
- Added PPTX import as templates: import `.pptx` files from the Templates page, automatically parse slides, extract the visual style, and create a template design contract.
- Added page title editing: edit individual slide titles from the editor.
- Added blank page creation: choose an existing slide as the layout base, create a new page at the end of the deck, and clear visible text for fast same-style page expansion.
- Improved the quick PPTX import editing entry on Home: import a `.pptx` directly from the Home page to create an editable session with progress and warning feedback.
- Improved edit and inspect modes: residual animations are finished before editing or AI inspection, reducing hidden, half-transparent, or hard-to-select elements on animated slides.
- Improved video element editing and playback: video elements can now be edited, including playback speed, volume, loop playback, autoplay, and more.
- Improved import and runtime stability: session import better handles flat ZIPs and complex archives, and imported sessions receive a default design contract.
- Fixed chart issues: category-axis bugs, horizontal bar chart tooltips, and zero-value data now render more accurately.
- Fixed page management issues: resolved animation problems during page management, reducing hidden, half-transparent, or hard-to-select elements when switching pages.

## 2026-05-24 · v2.0.11

### 中文

- 新增對話創作模式：先通過多輪對話梳理主題、資料、受衆、結構和每頁重點，再確認參數生成完整演示稿。適合需求尚不清晰、資料較複雜或需要先共同推敲大綱的場景，再去生成創作。
- 新增演講稿創作：支持爲整套幻燈片或當前頁生成演講稿，內置正式演講、輕鬆對話、敘事風格和自定義風格，並可複製或直接查看文件。
- 新增 Gemini Provider：設置頁支持配置 Google Gemini，可用於生成、編輯和對話創作。
- 重構動畫系統：支持更自然的入場動畫、錯峯展示和點擊逐條出現，讓演示內容可以按講述節奏逐步展開。
- 優化演示播放：鍵盤導航、鼠標點擊和逐條展示的銜接更順暢，帶點擊節奏的頁面不容易誤翻頁。
- 優化預覽與導出穩定性：帶動畫、圖表和複雜內容的頁面在預覽、縮略圖和導出時顯示更可靠。
- 優化生成預覽： 生成的時候支持邊生成邊預覽，無需等待生成完成，方便確認生成效果。

### English

- Added Chat to Create: first use a multi-turn conversation to clarify the topic, materials, audience, structure, and key points for each slide, then confirm the parameters and generate the full presentation. It is designed for unclear requirements, complex materials, or scenarios where you want to shape the outline together before creation.
- Added speaker script creation: generate scripts for the full deck or the current slide, with built-in formal, casual conversational, storytelling, and custom styles. Scripts can be copied or opened directly as a file.
- Added Gemini Provider: Google Gemini can now be configured in Settings and used for generation, editing, and Chat to Create.
- Rebuilt the animation system: supports more natural entrance animations, staggered reveals, and click-by-click content display, so presentation content can unfold with the speaker's rhythm.
- Improved presentation playback: keyboard navigation, mouse clicks, and step-by-step reveals now work together more smoothly, making click-paced pages less likely to accidentally advance to the next slide.
- Improved preview and export stability: slides with animations, charts, and complex content now render more reliably in previews, thumbnails, and exports.
- Improved generation preview: slides can now be previewed while they are still being generated, so you no longer need to wait for the full generation to finish before checking the result.

## 2026-05-18 · v2.0.10

### 中文

- 新增元素屬性面板：選中元素後可獨立調整文字樣式（字號、粗細、顏色）、外觀（背景色、邊框、圓角、陰影）、佈局（尺寸、位置）、圖層（層級、可見性）和媒體屬性，編輯更精細。
- 新增取色器：顏色選擇支持自定義取色板和透明度調節，編輯顏色更靈活直觀。
- 新增導出會話文件：編輯頁面一鍵導出會話生成的創意 PPT，另一臺電腦導入後可繼續二次編輯，跨設備協作無縫銜接。
- 新增導入會話文件：會話列表支持導入slide-pack 打包的文件或標準會話 ZIP，導入後可繼續二次編輯。
- 新增編輯頁面歷史記錄：編輯模式下自動記錄操作歷史，支持在保存版本前瀏覽和回退到任意編輯步驟。
- 新增字體數據回填：升級後自動爲已有會話補充字體信息，兼容歷史數據。
- 優化生成成功率：大幅提升頁面生成的穩定性和成功率，減少生成失敗和格式異常，增加兜底策略，減少token消耗。
- 優化生成引擎：改進大綱規劃與頁面寫入邏輯，生成結果更完整、佈局更合理。
- 優化編輯交互：元素選中和拖拽體驗更流暢，編輯模式整體更穩定。
- 修復風格預覽bug： 兼容win下的風格預覽問題，展示更直觀。

### English

- Added element inspector panel: select any element to independently adjust text styles (size, weight, color), appearance (background, border, radius, shadow), layout (size, position), layers (z-index, visibility), and media properties for more precise editing.
- Added color picker: custom color palette with transparency control for more flexible and intuitive color editing.
- Added session file export: one-click export of your AI-generated creative deck from the editing page — import it on another computer to continue editing, making cross-device collaboration seamless.
- Added session file import: import slide-pack files or standard session ZIPs from the session list and continue editing.
- Added edit history: edit mode automatically tracks changes, allowing you to browse and revert to any step before saving a version.
- Added font data backfill: automatically supplements font info for existing sessions after upgrade for backward compatibility.
- Improved generation success rate: significantly more stable page generation with fewer failures and format issues, added fallback strategies, and reduced token consumption.
- Improved generation engine: better outline planning and page writing logic for more complete results and layouts.
- Improved editing interaction: smoother element selection and dragging, with a more stable edit mode overall.
- Fixed style preview: resolved Windows compatibility issues for a more intuitive preview experience.

## 2026-05-17 · v2.0.9

### 中文

- 新增字體管理：內置 14 款精選 Google 字體（含中文），支持上傳本地 .woff2 字體，可自定義字體名稱、分類、用途和語言類型。
- 新增字體選擇：創建演示稿時可分別指定標題字體和正文字體，也可交給 AI 根據主題和風格自動匹配。
- 新增字體嵌渲染實質化：導出 PPTX 時自動嵌入已使用的字體文件，確保在 PowerPoint 中打開後字體不丟失、不回退。
- 新增風格縮略圖：風格列表展示可視化預覽縮略圖，挑選風格更直觀。
- 新增模型 Max Tokens 設置：可在設置中自定義模型最大輸出長度，適配不同模型的響應上限。
- 新增 Windows 系統託盤：關閉窗口後應用最小化到系統託盤，後臺運行不幹擾桌面。
- 優化風格管理：整體風格編輯和展示體驗更流暢，顯示風格的適用場景。
- 優化內置風格： 重寫內置風格的提示詞和style_skill。
- 優化 PPTX 導出：導出流程和效果持續改進（暫不支持視頻導出以及動畫導出，html的複雜度導致導出無法完全一樣）。
- 優化文字大小：優化生成默認最小文字爲16px，更適合ppt風格的預覽和演示。
- 修復：演示模式和本地預覽的鍵盤鼠標bug
- 修復：Windows 11 下批量導出圖片失敗的問題。
- 修復：修復默認導出目錄不正確的問題。

### English

- Added font management: 14 curated Google Fonts built-in (including CJK), with support for uploading local .woff2 fonts and customizing name, category, role, and script.
- Added font selection: choose title and body fonts separately before generation, or let AI auto-match based on topic and style.
- Added font embedding in PPTX export: used fonts are automatically embedded in the exported file so they display correctly in PowerPoint without fallback.
- Added style thumbnails: the style list now shows visual preview thumbnails for easier selection.
- Added Max Tokens setting: customize the model's maximum output length in Settings to match different model limits.
- Added Windows system tray: closing the window minimizes the app to the system tray instead of quitting.
- Improved style management: smoother editing and browsing experience, with applicable scenarios shown for each style.
- Improved built-in styles: rewrote prompts and style skills for all built-in styles.
- Improved PPTX export: further refinements to the export pipeline and output quality.
- Improved minimum font size: default minimum text size is now 16px for better readability in previews and presentations.
- Fixed keyboard and mouse issues in presentation mode and local preview.
- Fixed batch PNG export failing on Windows 11.
- Fixed incorrect default export directory.

## 2026-05-15 · v2.0.8

### 中文

- 優化數學公式導出：可編輯版 PPTX 中，公式以截圖形式作爲獨立圖片插入，確保在 PowerPoint 中正確顯示。
- 優化背景截圖：導出時自動隱藏已截圖的公式元素，避免公式重複出現在背景中。
- 新增： 一鍵打包當前的html pptx爲單個可執行文件（類似 PPTX），隨時隨地雙擊即可打開預覽，無需安裝任何軟件（你有瀏覽器就行）。

### English

- Improved math formula export: formulas are captured as individual images in editable PPTX for correct display in PowerPoint.
- Improved background capture: already-captured formula elements are hidden during background screenshot to avoid duplication.
- Added one-click HTML pack: bundle the current HTML presentation into a single executable file — double-click to open and present anywhere, no installation needed (just a browser).

## 2026-05-14 · v2.0.7

### 中文

- 新增以及重寫可編輯 PPTX 導出引擎：能導出80%-90%pptx效果（缺動畫，某些元素還在優化中）。
- 新增背景圖導出爲圖片版 PPTX：每頁截圖作爲整頁背景圖，兼容性最佳。
- 新增演示模式鍵盤翻頁：支持上下鍵翻頁以適配演講筆
- 修復演示模式/瀏覽器預覽模式 ESC 退出問題。

### English

- Added and rewrote editable PPTX export engine: achieves 80–90% visual fidelity (no animation support yet; some elements still being refined).
- Added image-based PPTX export: each slide is captured as a full-page background image for maximum compatibility.
- Added arrow key navigation in presentation mode: supports up/down keys for presenter remotes.
- Fixed ESC not exiting presentation / browser preview mode.

## 2026-05-14 · v2.0.6

### 中文

- 新增複製元素：編輯模式下可複製任意元素，複製的元素自動偏移並獨立可編輯。
- 新增可以添加圖片和視頻的功能：用戶可以在編輯模式下直接上傳圖片和視頻文件（存在本地資源目錄的）。
- 新增操作內可以撤銷和重做功能：用戶可以在操作內撤銷和重做操作，方便回退和恢復，最後再保存爲版本紀錄。
- 新增可以刪除任意元素的功能：用戶可以在編輯模式下，刪除任意元素（文字、圖片、視頻等），支持快捷鍵。
- 新增演示模式：支持直接進入全屏演示播放，鍵盤左右鍵或點擊切換頁面。
- 優化編輯模式穩定性：整體編輯、拖拽、保存和複製的體驗更可靠。
- 優化頁面編輯穩定性：用戶可以在頁面編輯模式下，更穩定地進行全局修改和局部修改。
- 優化左側邊欄可以摺疊：用戶可以在編輯模式下，摺疊左側邊欄，更方便操作。

### English

- Added element duplication: copy any element in edit mode; copies are auto-offset and independently editable.
- Added image and video insertion: upload images and videos directly in edit mode (stored in local assets directory).
- Added undo and redo: undo and redo edits before committing, then save as a version history entry.
- Added element deletion: delete any element (text, images, videos, etc.) in edit mode, with keyboard shortcut support.
- Added presentation mode: enter fullscreen presentation directly, navigate slides with arrow keys or clicks.
- Improved edit mode reliability: overall editing, dragging, saving, and copying are more stable.
- Improved page editing stability: global and partial edits are more reliable in page edit mode.
- Improved collapsible sidebar: the left sidebar can now be collapsed in edit mode for more workspace.

## 2026-05-11 · v2.0.5

### 中文

- 新增頁面支持拖拽排序調整位置功能
- 新增可以刪除頁面的功能
- 優化歷史版本體驗：讓歷史列表更像一條清楚的創作時間線（增加更多操作日誌記錄）。
- 優化回退體驗：回退到歷史版本後，頁面列表、頁面順序和預覽內容更穩定。
- 優化老會話體驗：從舊版本創建或切換過輸出目錄的會話，在預覽、編輯、回退時更穩定。
- 優化頁面編輯穩定性：單頁編輯、全局修改和局部修改更穩，系統會更主動地修正不完整的編輯結果。
- 優化生成和編輯的錯誤提示：用戶看到的是可理解的進度和失敗提示。
- 優化導入和歷史會話編輯：PPTX 導入會話和歷史會話在繼續編輯時更穩定。
- 優化風格表達：生成結果更強調情緒、敘事和表達，更加感性。

### English

- Added drag-and-drop page reordering.
- Added page deletion.
- Added history entries for page deletion.
- Improved the version history experience so the timeline reads like a clear creation story.
- Improved rollback reliability so the page list, page order, and preview stay consistent after reverting.
- Improved older sessions created in previous versions or sessions affected by output directory changes, making previewing, editing, and rollback more stable.
- Improved edit reliability for single-slide edits, deck-wide edits, and element-level edits, with more proactive recovery for incomplete edit results.
- Improved error messages for generation and editing so users see clear progress and understandable failures.
- Improved continuing edits for PPTX-imported sessions and historical sessions.
- Improved style expression so results feel more emotional, narrative, and expressive.

## 2026-05-09

### 中文

- 新增圖片解析創建：首頁上傳圖片（png/jpg/jpeg/webp）後，系統自動從圖片內容生成演示提綱，同時提取視覺風格並保存爲自定義風格 Skill，創建表單一鍵回填。
- 新增圖片導入風格：風格編輯頁支持直接導入圖片，自動提取配色、字體、版式、組件等視覺規則並回填表單。
- 新增版本歷史：每次生成或編輯自動記錄歷史版本，支持查看和回退到任意歷史版本，即使改錯也能回退到之前版本。
- 新增主會話編輯：主會話現在可以統一修改一個或多個頁面，不再僅限於單頁編輯，即使改錯也能回退到之前版本。
- 新增視頻素材插入：會話詳情頁支持上傳 mp4/webm/ogg 視頻素材，並可在頁面編輯中引用本地視頻路徑插入到指定位置。
- 優化編輯穩定性：頁面編輯和主會話編輯進入自動修復階段，遇到頁面校驗失敗時會帶錯誤信息自動重試一次，減少壞頁面和手動重試。
- 優化刪除提示：會話列表刪除和歷史版本回退等操作改爲彈窗二次確認。

### English

- Added image-based creation and image style import.
- Added version history and main-session editing.
- Added video assets for page edits (mp4/webm/ogg).
- Improved edit reliability with one automatic retry after page validation failures.
- Improved delete and rollback confirmations.

## 2026-05-08

### 中文

 - 新增風格提取：導入文件或 PPTX 後，自動提取配色、字體和佈局風格，保存爲獨立的風格 Skill。
 - 優化 PPTX 導入：導入 PPTX 後自動提取原稿視覺風格Skill保存到系統中，新增頁面時自動繼承原 PPTX 的配色、字體和佈局。

### English

- Added style extraction: imported files and PPTX presentations automatically have their visual style extracted and saved as a reusable Style Skill.
- Improved PPTX import: newly added pages now inherit the imported PPTX's original colors, typography, and layout.

## 2026-05-07

### 中文

 - 新增編輯頁：可以新增頁面，每個頁面可以包含多個元素。
 - 優化pptx：優化了導出pptx的流程，支持更多pptx的元素導出。
 - 優化性能： 優化整個應用的性能和穩定性。

### English

- Added page insertion: add new pages to an existing deck, each supporting multiple elements.
- Improved PPTX export: refined the export pipeline to support a wider range of PPTX elements.
- Improved performance: overall app performance and stability improvements.

## 2026-05-06

### 中文

- 新增文字編輯：雙擊選中頁面文字後可直接修改內容和樣式，修改結果實時同步到頁面。
- 新增生成取消：創意生成過程中可隨時取消。
- 優化檢選模式：選中元素後的操作更精準，修改體驗更順暢。
- 優化編輯模式：完善單頁編輯流程，編輯結果更穩定。
- 優化生成進度：底部新增階段指示（準備 → 規劃 → 生成 → 校驗），實時顯示頁面完成進度。
- 優化生成日誌：日誌更簡潔，只保留關鍵進度和結果，減少刷屏。
- 優化生成速度和穩定性：整體生成速度提升約 20%-40%，提升模型的生成成功率，單頁編輯響應更快。
- 優化會話列表：顯示每次生成的耗時，方便對比不同配置的生成效果。

### English

- Added text editing: select text on a slide to edit content and styling directly, with changes synced in real time.
- Improved element selection: selecting and modifying elements is more precise and fluid.
- Improved editing mode: refined the single-slide editing workflow for more reliable results.
- Improved generation progress: a new step indicator (Prepare → Plan → Generate → Validate) shows the current stage and real-time page count.
- Improved generation logs: cleaner log output showing only key milestones and results.
- Improved generation speed: overall generation is approximately 20–40% faster, with quicker single-slide edits.
- Improved generation reliability: enhanced page-write validation with automatic retries on failure.
- Added generation cancellation: cancel an in-progress generation at any time.
- Improved session list: generation duration is shown for each session.

---

## 2026-05-01

### 中文

- 新增多模型列表管理：可以在設置中添加多個模型，並把常用模型設爲默認模型，隨意切換模型（Breaking change）。
- 優化生成穩定性： 生成的穩定性得到了顯著提升，減少了直接失敗的情況。
- 優化錯誤提示：設置和生成相關提示會跟隨當前界面語言顯示中文或英文。
- 優化生成頁日誌：日誌面板滾動更穩定，連續生成時更容易看到最新進度。
- 優化pptx導出：對於pptx導出進一步做優化策略，進一步提升導出效果（未引入ocr識別）。

### English

- Added multi-model list management: add multiple models in Settings, choose a default model, and switch between models freely.
- Improved generation stability: generation is noticeably more reliable, with fewer cases that fail outright.
- Improved error messages: Settings and generation errors now follow the current interface language.
- Improved generation logs: the log panel scrolls more reliably and keeps the latest progress easier to see.
- Improved PPTX export: added further export optimizations without introducing OCR.

---

## 2026-04-30

### 中文

- 優化頁面調整體驗：一切皆可拖拽，現在可以直接拖拽和縮放，調整文字、圖片、公式、列表、數據標籤和圖表更順手。
- 優化調整保存流程：頁面調整不會立即保存，可連續微調多個元素後統一確認，也可以退出並放棄本次調整。
- 優化 AI 生成版式：頁面標題和內容佈局更靈活，生成結果不再侷限於固定的頂部標題模板。
- 優化圖表展示效果：座標軸、提示信息和數據標籤更清爽，減少過長數字和圖表顯示異常。
- 新增中英文界面語言：應用界面可切換中文或英文，生成內容仍會根據用戶輸入和資料自行判斷語言。
- 優化生成進度展示：進度日誌更簡潔統一，減少重複、混雜或過度解釋的狀態信息。
- 優化頁面版式延續性：生成、編輯和重試時會更好地延續每頁原本的內容結構和視覺方向。
- 優化模型設置體驗：常用模型配置更清晰，高級超時參數獨立收納，適合本地模型或響應較慢的模型按需調整。
- 優化會話詳情頁體驗：頂部工具、預覽標題、右側消息面板和整體圓角更剋制，界面層次更清爽。
- 優化圖表生成穩定性：減少圖表高度異常、被壓縮或顯示不完整的問題。

### English

- Improved slide adjustment: more slide content can now be moved and resized directly, making text, images, formulas, lists, data labels, and charts easier to refine.
- Improved the adjustment flow: layout edits are no longer saved immediately, so users can make several changes and then confirm or discard them together.
- Improved AI-generated layouts: titles and content placement are more flexible, moving beyond a fixed top-title template.
- Improved chart presentation: axes, tooltips, and data labels are cleaner, with fewer overly long numbers and fewer visual glitches.
- Added Chinese and English interface languages: the app UI can switch languages while generated content still follows the user's prompt and source materials.
- Improved generation progress: progress logs are cleaner and more consistent, with less repetition and fewer overly verbose status messages.
- Improved slide layout continuity: generation, editing, and retries now better preserve each slide's content structure and visual direction.
- Improved model settings: common model fields are easier to scan, while advanced timeout controls are tucked away for slower or local models.
- Improved the session detail experience: toolbar buttons, preview titles, the message panel, and overall corner radii now feel more restrained and easier to read.
- Fixed duplicate messages during single-slide editing: current-slide edits now show a cleaner, more stable conversation flow.
- Improved chart stability: reduced cases where charts appear compressed, clipped, or lose their intended height.

---

## 2026-04-29

### 中文

- 新增 PPTX 導入：可把本地 PPTX 轉成應用內可編輯的演示稿，再繼續預覽、調整和對話修改。
- 優化從文檔創建演示：上傳文檔後會更穩定地整理主題、頁數和詳細描述，大綱頁數會更貼近實際內容。
- 新增數學公式渲染：生成的頁面可直接顯示常見 LaTeX 公式，導出時也會盡量保留公式效果。
- 優化可編輯 PPTX 導出：減少文字重疊問題，提升中英文混排和公式頁面的導出效果。
- 優化首頁入口：文檔解析和 PPTX 導入入口更清晰，並提示本地文檔只會在本機處理。
- 優化會話列表：可區分 AI 創建和 PPTX 導入的演示稿，並支持修改演示稿名稱。

### English

- Added PPTX import: convert local PPTX files into editable in-app presentations for previewing, positioning, and chat-based editing.
- Improved document-based creation: uploaded documents now produce more reliable topics, page counts, and descriptions, with outlines that better match the content.
- Added math formula rendering: generated pages can display common LaTeX formulas, and exports try to preserve formula visuals.
- Improved editable PPTX export: reduced text overlap and improved mixed Chinese/English and formula-heavy slides.
- Improved the Home page: document parsing and PPTX import are easier to find, with clearer local-document privacy messaging.
- Improved the session list: imported PPTX sessions are easier to identify, and presentation names can be renamed.

---

## 2026-04-28

### 中文

- 新增頁面元素拖拽調整：在預覽中開啓“調整位置”後，可直接拖拽帶結構標識的頁面模塊並保存位置。
- 新增從文檔創建演示：可上傳 txt、md、csv、docx 文檔，自動整理主題、頁數和詳細描述。
- 補充動畫能力文檔：說明基於 Anime.js v4 的基礎整元素動畫，並加入示例 GIF。
- 優化文檔生成體驗：上傳較長文檔後，每頁內容會更貼近原文對應部分，生成速度和穩定性更好。
- 優化 OpenAI 兼容模型體驗：默認關閉 thinking，減少文檔解析、工具調用和重試生成時的兼容報錯。
- 優化會話詳情頁結構：拆分頁面側欄、預覽區、頂部工具欄和消息面板。

### English

- Added drag-to-position editing: enable Adjust Position in preview to drag structured page blocks and persist their layout.
- Added document-based creation: upload txt, md, csv, or docx files to automatically prepare the topic, page count, and description.
- Added animation documentation: describes basic Anime.js v4-powered whole-element animations with an example GIF.
- Improved document-based creation: pages now stay closer to the relevant parts of long uploaded documents, with better speed and stability.
- Improved OpenAI-compatible model behavior: thinking mode is disabled by default to reduce compatibility errors during document parsing, tool calls, and retry generation.
- Improved the session detail architecture: split the page sidebar, preview stage, top toolbar, and message panel, and added a page-level UI store for local state.

---

## 2026-04-27

### 中文

- 新增版本提醒：應用啓動後會檢查 GitHub Releases，如有新版本會提示用戶前往下載。
- 優化生成恢復邏輯：應用意外或者退出後，可以根據已完成頁面繼續恢復進度。
- 優化失敗處理：全部失敗時提示重新生成；部分完成時提示繼續生成剩餘頁面。
- 優化重試鏈路：只重試未完成頁面，並保留用戶補充說明。
- 優化編輯穩定性：編輯時會校驗頁面結構，避免壞頁面被誤標記爲完成。
- 優化模型配置：生成與編輯統一使用系統設置中的最新模型配置。
- 優化模型穩定性：增強大綱規劃與 JSON 輸出解析，減少弱模型或本地模型格式異常導致的失敗。
- 新增可編輯 PPTX 導出：儘量保留文字、圖片、顏色與基礎佈局，方便在 PowerPoint / Keynote 中繼續編輯。
- 新增批量 PNG 導出：一鍵將當前 deck 的所有頁面導出爲圖片。
- 優化 PDF / PNG / PPTX 導出穩定性：導出時儘量使用靜態頁面狀態，減少動畫對輸出結果的影響。
- 優化頁面生成約束：生成時按固定 16:9 畫布和內容高度預算組織頁面，減少元素超出畫布的問題。
- 優化 README 文檔：補充多格式導出說明，並完善 macOS / Windows 未簽名應用打開指引。

### English

- Added update notifications: the app checks GitHub Releases on startup and lets users open the release page when a newer version is available.
- Improved generation recovery: progress can be restored from completed pages after an unexpected app exit.
- Improved failure handling: fully failed sessions prompt regeneration, while partially completed sessions can continue remaining pages.
- Improved retry flow: only unfinished pages are retried, and user retry notes are preserved.
- Improved edit stability: page structure is validated before marking edits as completed.
- Unified model settings: generation and editing now always use the latest model configuration from Settings.
- Improved model stability: outline planning and JSON output parsing are more tolerant of malformed local/weak-model responses.
- Added editable PPTX export: preserves text, images, colors, and basic layout where possible for continued editing in PowerPoint / Keynote.
- Added batch PNG export: export every slide in the current deck as images with one click.
- Improved PDF / PNG / PPTX export stability: exports use a static slide state where possible to reduce animation-related output issues.
- Improved generation layout constraints: slides now follow a fixed 16:9 canvas and content-height budget to reduce overflow.
- Updated README docs: added multi-format export notes and clearer macOS / Windows unsigned-app instructions.

---

## 2026-04-26

### 中文

- 支持通過一句話生成本地 HTML 幻燈片。
- 支持逐頁預覽、演示模式和鍵盤切換。
- 支持對話式修改當前頁內容。
- 支持檢選頁面元素後精準修改。
- 支持圖片素材上傳到本地會話目錄並在編輯時引用。
- 支持一鍵導出 PDF。
- 新增風格管理，可查看、編輯和新增風格 Skill。
- 優化生成頁動畫、縮略圖列表、預覽畫布和右側 AI 面板體驗。
- 補充 Ollama / OpenAI 兼容模型使用說明。
- 補充 macOS 與 Windows 未簽名應用打開說明。

### English

- Added one-prompt local HTML slide generation.
- Added page-by-page preview, presentation mode, and keyboard navigation.
- Added chat-based editing for the current page.
- Added element inspection for more precise edits.
- Added local image asset uploads for use during page editing.
- Added one-click PDF export.
- Added style management for viewing, editing, and creating style skills.
- Improved the generation animation, thumbnail list, preview canvas, and AI message panel.
- Added usage notes for Ollama / OpenAI-compatible models.
- Added notes for opening unsigned macOS and Windows builds.
