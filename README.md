<div align="center">
  <img src="thumb.png" alt="Oh My PPT" width="200" />
  <br/>
  <br/>

![AI PPT Generator](https://img.shields.io/badge/AI%20PPT-Generator-2f6d49)
![PPTX](https://img.shields.io/badge/PPTX-Import%20%26%20Export-1769aa)
![AI Image Generation](https://img.shields.io/badge/AI%20Images-Generation-9a5b36)
![Local-first](https://img.shields.io/badge/Local--first-Private-3b7a57)
![License](https://img.shields.io/badge/license-Apache--2.0-green)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848f)
![React](https://img.shields.io/badge/React-App-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Theme](https://img.shields.io/badge/Theme-Midnight%20Forest%20Dark-2b3d26)

**Oh My PPT — 本地優先的 AI 簡報生成與編輯工具**

[English](./README.en.md) | [Fork 維護說明](./FORK.md) | [為什麼選擇 Oh My PPT](#why) • [核心功能](#features) • [使用流程](#workflow) • [更新日誌](./CHANGELOG.md) • [常見問題](#usage-notes)

  <p>
    AI 驅動可編輯 HTML，重構下一代 PPT 生產流程。<br/>
    描述想表達的主題，讓 AI 自動產出大綱、版面結構與配圖。<br/>
    從發想創作、即時編輯、全螢幕演示到跨格式導出，皆在本地優先架構中完成。<br/>
    Local-first · Your models, your workflow.
  </p>

> [!NOTE]
> 本 repo 為 [`arcsin1/oh-my-ppt`](https://github.com/arcsin1/oh-my-ppt) 的維護型 fork，以 **Apache License 2.0** 授權釋出。
> 本線主要聚焦於 Windows 11 原生開發、繁體中文文件入口、可審計的上游追蹤機制與工程門禁硬化。詳細差異與維護原則見 [`FORK.md`](FORK.md) 與 [`NOTICE.md`](NOTICE.md)。

  <img src="./docs/images/anime.gif" alt="Oh My PPT 動畫演示" width="600" />

</div>

---

## 目錄

- [為什麼選擇 Oh My PPT](#why)
- [核心功能](#features)
- [Fork 獨創特色](#fork-features)
- [使用流程](#workflow)
- [舊 PPTX 範本匯入編輯](#pptx-import)
- [匯出可編輯 PPTX 與多種格式](#export)
- [內建 90+ 專業風格 Skill](#style-skills)
- [AI 生圖與智慧配圖](#image-generation)
- [本地 Ollama 模型串接](#ollama)
- [字型管理與動畫支援](#fonts-animations)
- [Windows 11 本機開發](#development)
- [常見使用問題](#usage-notes)
- [授權與聲明](#license)
- [參考項目](#references)

---

<a id="why"></a>
## 為什麼選擇 Oh My PPT

傳統製作簡報常陷入手動微調版面、對齊元件的繁瑣重複勞動中；現有雲端 AI 簡報工具則多為封閉生態，既無法隨意調整排版，更可能存在商業機密外流風險。

Oh My PPT 提供全新解法：
- **可編輯的網頁架構**：底層採用標準 HTML/CSS/Tailwind，生成後可隨意修改文字、樣式、階層與排版，告別死板版面。
- **本地優先架構**：所有資料、簡報工作階段與素材皆保存在本機，確保隱私與商業機密安全。
- **自備模型自由切換**：自由串接本地 Ollama（如 Qwen2.5-Coder、DeepSeek）或雲端 API（OpenAI、Claude、Gemini），不綁定單一平臺。
- **跨平臺桌面應用**：基於 Electron + React + TypeScript 打造流暢桌面體驗。

---

<a id="features"></a>
## 核心功能

- 📥 **匯入舊 PPTX 範本編輯，還原度接近 100%** — 將既有範本與歷史文件匯入桌面應用，轉為可拖曳、調整、AI 修改與版本管理的頁面；解析與結構化轉換為完全自研。
- 📤 **從桌面應用匯出可編輯 PPTX，還原度接近 100%** — 新建或編輯的簡報匯出為可在 PowerPoint / Keynote 中繼續編輯的真實 PPTX 檔案；匯出引擎為完全自研，複雜物件持續優化。
- 💬 **主題創作** — 填寫主題、詳細描述與頁面設定，AI 自動規劃大綱、配色與排版，產出完整簡報。
- 🔀 **多工並行生成** — 可同時提交多個生成任務並行執行，完成後自動彈出通知。
- 📐 **多尺寸多格式畫布** — 支援寬螢幕、4:3 投影、直式 9:16、方圖 1:1、社羣圖文等格式，生成、預覽、編輯與匯出皆保留真實比例。
- 📄 **從文件建立** — 上傳 txt、md、csv、docx 文件，自動整理主題、頁數與詳細描述，生成時持續參考原檔內容。
- 🧱 **範本庫與範本建立** — 可將已生成或已編輯的簡報存為範本，也支援 PPTX 匯入為範本，並可複用範本建立新會話。
- 🖼️ **圖片識別生成風格與大綱** — 上傳截圖或設計稿，自動識別視覺特徵並產出獨特風格與簡報大綱。
- 🖼️ **AI 生圖與智慧配圖** — 建立時可開啟自動配圖，AI 依據當頁內容、版面留白與風格按需產出插畫、背景與視覺素材。
- ✨ **編輯頁生圖工作臺** — 依據當頁標題與大綱產出提示詞，指定補充描述與圖片尺寸後生圖；結果可預覽、插入畫布或設為頁面背景。
- 🏷️ **支援生圖的風格篩選** — 風格庫會標識可生圖的風格，篩選後使用與頁面視覺方向一致的配圖。
- 🔒 **本地優先** — 會話、源文件、素材與生成結果皆保存在本機；不需要 Oh My PPT 帳號或平臺雲端。
- 🔤 **字型管理** — 內建 14 款精選 Google 字型（含中文），支援上傳本地字型，可分別指定標題與正文字型或交由 AI 自動匹配。
- 🎨 **內建 90+ 風格 Skill** — 極簡白、賽博霓虹、包浩斯、日式簡約等，亦支援自訂風格。
- ✏️ **對話式修改** — 對著某一頁說「標題換個顏色」「加個數據圖表」，精準修改不用重做。
- 🖱️ **視覺化編輯** — 一切可見元素皆可拖曳與調整大小，一切元素皆可檢選並讓 AI 修改。
- 📸 **插入圖片與影片** — 編輯模式下直接上傳圖片與影片，支援從素材庫或本地檔案加入。
- 📋 **複製元素** — 一鍵複製任意元素，自動偏移並可獨立編輯。
- ↩️ **復原與重做** — 編輯過程中隨時復原與重做，最後再統一存為版本紀錄。
- 🖥️ **演示模式** — 一鍵進入全螢幕演示，鍵盤左右鍵或點擊切換頁面。
- 📝 **演講稿生成** — 支援為整套投影片或當頁產出演講稿，內建正式演講、輕鬆對話、敘事風格與自訂風格。
- 🎬 **動畫支援** — 16+ 種頁面切換動畫，加上基於 Anime.js v4 的元素動畫。
- 🎞️ **單元素動畫設定** — 編輯時可選中個別元素，設定入場、強調或退出效果。
- 🧮 **數學公式渲染** — 支援常見 LaTeX 公式顯示。
- 📄 **多格式匯出** — PDF、批次 PNG、PNG 長圖、MP4 影片。
- 🏷️ **會話管理** — 可區分 AI 建立與 PPTX 匯入，支援重新命名。
- 🔄 **版本歷史回退** — 自動儲存每次修改，支援任意版本一鍵回退。
- 📦 **一鍵打包** — 將 HTML 簡報打包為獨立可執行檔案，雙擊即可在瀏覽器演示。
- 💾 **創意 PPT 匯入匯出** — 編輯頁匯出會話生成的創意 PPT，另一臺電腦匯入後可繼續編輯。

<p>
<img width="30%" alt="Oh My PPT - 首頁" src="./docs/images/home.webp" />
<img width="30%" alt="Oh My PPT - 匯出" src="./docs/images/10.webp" />
<img width="30%" alt="Oh My PPT - 動畫" src="./docs/images/11.webp" />
</p>

<img width="600" alt="Oh My PPT - 編輯畫布" src="./docs/images/edit.webp" />

> 註：上方截圖取自上游專案，介面文字初期為簡體中文，僅供參考；後續將以繁體中文重新截圖。

---

<a id="fork-features"></a>
## 🌟 本 Fork 獨創特色與最新功能 (v2.5.3)

本維護版本除延續 Oh My PPT 核心優勢外，獨家新增並最佳化以下功能：

1. 🌙 **獨創「Midnight Forest 暗黑森林」深色主題**：
   - 專為長時間夜間製作與編輯簡報打造的高對比護眼深色模式，嚴格依據 WCAG AAA 對比度規範設計。
   - 建立 5 層表面層級架構（畫布底 `#111411` → 側欄 `#151a14` → 卡片 `#191f18` → 輸入框 `#20291f` → 下拉彈窗 `#222c21`），徹底解決「白底白字」或對比度不足的缺陷。
   - 於**視窗頂部標題列**（視窗控制鈕旁）與**左側邊欄頭部**均配置了即時切換按鈕，支援「淺色模式 / 深色模式 / 跟隨系統」三檔模式，自動連動作業系統外觀設定。詳細設計系統標準請參閱 [`docs/THEME_MIDNIGHT_FOREST.md`](docs/THEME_MIDNIGHT_FOREST.md)。
   - **核心色彩體系速查表**：

     | 階層 / 角色 | 色碼數值 | 語義用途與對比考量 |
     |---|---|---|
     | **Level 0 畫布底** | `#111411` | 深苔墨黑底色，消除夜間刺眼眩光 |
     | **Level 1 側欄** | `#151A14` | 側邊功能導覽，微明度立體區隔 |
     | **Level 2 內容卡片** | `#191F18` | 實體卡片底色，徹底解決白底霧化 |
     | **Level 3 輸入控制項** | `#20291F` | 輸入框、下拉選單背景，層次分明 |
     | **Level 4 浮層/通知** | `#222C21` / `#252015` | 下拉選單、Toast 訊息通知方塊 |
     | **主文字 / 標題** | `#F2F7ED` / `#FFFFFF` | 粗體純白，對比度 >13:1 (WCAG AAA) |
     | **次要文字 / 說明** | `#CDD9C7` / `#E0EBE0` | 高對比亮灰綠，對比度 >10:1 |
     | **輔助 / 標籤** | `#A4BBA0` / `#A8C29E` | 鼠尾草灰綠，對比度 >5.2:1 |

2. 📖 **內建原生離線說明中心（`/help`）**：
   - 完整收錄常見問題（FAQ）、各大 AI 模型（OpenAI、Claude、Gemini、DeepSeek、Ollama 等）配置指引，以及深度思考推理模型（R1、o1/o3、Claude 3.7）JSON 參數速查。
   - 側邊欄「幫助文件」與設定頁「模型說明」全面改為站內原生切換，無需開啟瀏覽器，完全離線可用。
   - 主進程版本更新檢查由上游官網轉向本 repo 專屬 GitHub Releases API，完全阻斷向原作者伺服器的背景通訊。

3. 🪟 **純 Windows 11 原生架構維護**：
   - 刪除所有非 Windows 平台的打包設定、二進位工具與分支代碼，極致精簡技術包袱。

4. 🇹🇼 **全庫繁體中文化與去廣告**：
   - 刪除簡中 README，統一繁體中文與英文說明，全量清理上游廣告、贊助 QR Code 與外部通訊群組。

---

<a id="workflow"></a>
## 使用流程

> 💡 匯入舊 PPTX 範本繼續編輯，或選擇創作方式 → 確認主題 / 資料 / 頁數 / 尺寸格式 / 風格 / 字型 / 配圖 → AI 生成 HTML 簡報 → 預覽、演示、編輯 → 匯出可編輯 PPTX、PDF / PNG / PNG 長圖 / MP4 / HTML 打包

首頁支援幾種常用入口：

- **主題創作**：填寫主題、尺寸格式與詳細描述，產出完整簡報、直式內容、方圖或社羣圖文。
- **對話創作**：先透過多輪對話梳理主題、資料、受眾、結構與每頁重點，適合需求尚不清晰的場景。
- **上傳文件解析**：上傳 txt、md、csv、docx 等檔案，讓應用先整理主題、頁數與詳細描述，生成時持續參考原檔內容。
- **從範本建立**：在範本頁選擇已儲存的範本，可直接複製為可編輯 PPT 會話，也可輸入新主題或上傳文件後沿用範本版面重新產出內容。

---

<a id="pptx-import"></a>
## 舊 PPTX 範本匯入編輯

支援將既有的 `.pptx` 投影片解析轉換為可編輯的結構化資料，保留原有版式、色系與結構，快速以 AI 接續編輯更新。

PPTX 解析與結構化轉換為 Oh My PPT 完全自研。複雜形狀、圖表、表格、動畫、混排文字與極端版面持續改善中；實際還原度依來源檔案的 PowerPoint 功能、字型與素材複雜度而異。

---

<a id="export"></a>
## 匯出可編輯 PPTX 與多種格式

目前支援六種匯出與分享途徑：
- **可編輯 PPTX**：純自研匯出引擎，導出可在 PowerPoint / Keynote 中繼續編輯的真實向量檔案。
- **PDF**：適合直接發送、歸檔與列印。
- **PNG 圖片包**：一鍵批次導出所有投影片單張圖片。
- **PNG 長圖**：全套頁面縱向拼接成高解析長圖，適合社羣分享與行動端閱讀。
- **MP4 影片**：導出為動畫影片，適合社羣影音平臺與展示宣傳。
- **HTML 獨立運行包**：將簡報與資源打包，雙擊可在任何瀏覽器離線全螢幕演示。

---

<a id="style-skills"></a>
## 內建 90+ 專業風格 Skill

整合豐富的設計風格庫（商業簡報、學術演講、科技發布會、極簡風、手繪風等），一鍵切換整套投影片的配色、字型排版與裝飾風格。

想製作自己的風格 Skill，可以使用風格生成包：[arcsin1/style-generate-skill](https://github.com/arcsin1/style-generate-skill)。

<img src="./docs/images/4.webp" alt="Oh My PPT 風格庫" width="500" />

> 註：上方截圖取自上游專案，介面文字初期為簡體中文，僅供參考；後續將以繁體中文重新截圖。

---

<a id="image-generation"></a>
## AI 生圖與智慧配圖

生圖能力分為兩個入口：

| 使用場景 | 怎麼使用 | 結果 |
| --- | --- | --- |
| 建立整套簡報 | 在「設定 → 生圖模型」新增並**驗證**模型；建立頁勾選「啟用配圖生成」，選擇帶「支援生圖」標識的風格 | AI 僅在合適的視覺位置自動產出插畫、背景或視覺元素 |
| 編輯已有頁面 | 開啟編輯頁的生圖面板，參考當頁內容產出提示詞或自行填寫，選擇模型和尺寸後生圖 | 可預覽結果，插入畫布繼續排版，或直接設為當頁背景 |

支援配置多個生圖服務，並在建立或編輯時選擇要使用的模型。

<img src="./docs/images/3.png" alt="Oh My PPT 生圖設定" width="500" />

> 註：上方截圖取自上游專案，介面文字初期為簡體中文，僅供參考；後續將以繁體中文重新截圖。

---

<a id="ollama"></a>
## 本地 Ollama 模型串接（OpenAI 相容）

本專案支援完全離線透過 **OpenAI 相容協議** 串接本地 Ollama：

在應用內「設定 → 文字模型」填寫：
- `provider`: `openai`
- `base_url`: `http://127.0.0.1:11434/v1`
- `model`: 本地拉取的模型名稱（建議 `qwen2.5-coder:14b` 或更高等級模型）
- `api_key`: 填入任意非空字串（例如 `ollama`）

說明：Ollama 本地配置可用於文字大綱生成、投影片創作與對話編輯；若需生圖請另行配置生圖模型。

---

<a id="fonts-animations"></a>
## 字型管理與動畫支援

- **字型管理**：支援系統內建字型、WebFont 及自訂字型檔案匯入，並透過 `woff2-encoder` 與 `fonteditor-core` 進行封裝優化。
- **頁面轉場與動畫**：內建現代簡約的元件進場動畫與切頁過渡效果。

<img src="./docs/images/font.webp" alt="Oh My PPT 字型管理" width="500" />

> 註：上方截圖取自上游專案，介面文字初期為簡體中文，僅供參考；後續將以繁體中文重新截圖。

<p>
<img src="./docs/images/anime.gif" alt="Oh My PPT 動畫演示" width="40%" />
</p>

---

<a id="development"></a>
## Windows 11 本機開發

### 環境需求
- Windows 11 原生環境（PowerShell 7+）
- Node.js `>=20`
- pnpm `10.10.0`
- Python `>=3.10`（供維護門禁工具使用）

### 快速開始
```powershell
# 1. 複製 repository
git clone https://github.com/SanHsien/oh-my-ppt.git
cd oh-my-ppt

# 2. 安裝產品依賴（可選，執行桌面開發時需要）
pnpm install

# 3. 啟動本機開發模式（Electron + Vite Dev Server）
pnpm dev

# 4. 執行維護門禁檢查（一鍵驗收）
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

詳細開發指令、架構說明與測試規範請參閱 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

---

<a id="usage-notes"></a>
## 常見使用問題

### 1. 記得填寫模型金鑰
首次使用請進入「設定 → 文字模型」填寫 API Key 與 Provider，方可啟動創作與編輯對話。

### 2. Windows SmartScreen 提示
因為開源發行版本尚未簽章，Windows 首次開啟時可能彈出「Windows 已保護您的電腦」提示：
1. 點擊「詳細資訊」。
2. 確認應用程式名稱為 `OhMyPPT`。
3. 點擊「仍要執行」。

---

<a id="license"></a>
## 授權與聲明

- 原專案版權：Copyright © 2026 arcsin1 (zy19931129@gmail.com).
- 本 Fork 維護：Copyright © 2026 SanHsien.
- 本專案採用 **[Apache License 2.0](LICENSE)** 授權。
- 第三方商標與軟體名稱僅供技術相容性說明使用，詳細法律聲明請參閱 [`NOTICE.md`](NOTICE.md)。

---

<a id="references"></a>
## 參考項目

- [@arcsin1/pptx2json](https://www.npmjs.com/package/@arcsin1/pptx2json) — PPTX 匯入底層，用於解析 PPTX 並轉換為可編輯的結構化資料。
- [@arcsin1/html2pptx](https://www.npmjs.com/package/@arcsin1/html2pptx) — PPTX 匯出底層，用於將 HTML 轉換為可編輯的真實 PPTX 檔案。
- [arcsin1/style-generate-skill](https://github.com/arcsin1/style-generate-skill) — 風格生成 Skill，用於把參考設計、配色與排版要求整理成可匯入應用的風格包。
