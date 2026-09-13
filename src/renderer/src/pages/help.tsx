import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { HelpCircle, Cpu, Brain, Check, Copy, Search, ExternalLink } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: '如何下載與安裝？',
    a: '從本專案的 GitHub Releases 頁面下載最新版檔案。我們提供「標準安裝版（.exe）」與「綠色免安裝可攜版（.zip）」。雙擊 setup 安裝程式即可自動完成安裝並建立捷徑；免安裝版解壓縮後直接執行 ohmyppt.exe 即可使用。'
  },
  {
    q: '需要保持聯網嗎？所有資料是否安全？',
    a: '核心功能完全本地優先（Local-first）。所有投影片、頁面結構、會話與歷史紀錄皆保存在您的本機 SQLite 資料庫中。若串接本地 Ollama 模型，可達成 100% 離線生成。若配置雲端模型，API Key 與請求只在生成時直接與對應服務商通訊，不會經由任何第三方伺服器。'
  },
  {
    q: '如何配置 AI 文字模型？',
    a: '進入「設定 → 文字模型」，點擊「新增配置」。選擇 Provider（如 openai、anthropic、gemini），填寫 Base URL（如使用中轉或本地請填寫，官方直連可留空預設）、模型名稱與 API Key。點擊「驗證」確認連通後，儲存並設為「啟用」即可。'
  },
  {
    q: '推薦使用哪些模型？',
    a: '長文梳理與最高品質大綱推薦 Claude 3.7 Sonnet、GPT-4o、Gemini 2.0 Flash。高性價比且連線快速推薦 DeepSeek V3/R1、Qwen2.5-Coder、豆包 (Doubao)、智譜 GLM。純本地無聯網推薦使用 Ollama 搭配 qwen2.5-coder:14b 或 32b。'
  },
  {
    q: '如何使用本地 Ollama 模型？',
    a: '在本機安裝並啟動 Ollama（如 ollama run qwen2.5-coder:14b）。在 Oh My PPT「設定 → 文字模型」中新增：協議選擇 openai，Base URL 填寫 http://127.0.0.1:11434/v1，模型名稱填寫本地模型名（如 qwen2.5-coder:14b），API Key 填入任意非空字串（如 ollama），點擊驗證即可。'
  },
  {
    q: '生圖模型如何配置？',
    a: '文字大綱模型與生圖模型為獨立解耦架構。前往「設定 → 生圖模型」，新增支援的圖片服務商（如 openai、siliconflow、gemini、jimeng）。點擊「驗證」進行一次微型出圖測試，驗證成功後即可在創作頁開啟「自動配圖」。'
  },
  {
    q: '連線超時或驗證失敗怎麼辦？',
    a: '請依序檢查：1) 本機網路連線是否通暢；2) API Key 與 Base URL 是否填寫正確（避免首尾多餘空格）；3) 若使用國際端點且身處受限網路，可在「設定 → 網路設定」配置代理伺服器（如 http://127.0.0.1:7890）；4) 若使用 Ollama，請確認服務已在背景啟動。'
  },
  {
    q: 'Windows SmartScreen 提示如何處理？',
    a: '因為開源發行版尚未購買微軟昂貴的商業數位簽章憑證，Windows 首次開啟時可能會跳出保護提示。請點擊「詳細資訊」（More info），確認應用程式為 OhMyPPT，點擊「仍要執行」（Run anyway）即可正常使用。'
  },
  {
    q: '匯出的 PPTX 可以在微軟 Office 中編輯嗎？',
    a: '可以。Oh My PPT 採用純自研的 html2pptx 引擎，匯出的是原生微軟 OpenXML 格式（.pptx）。投影片文字、字型排版、向量形狀與顏色皆可在 PowerPoint、Keynote 與 WPS Office 中進行二次編輯。'
  }
]

const MODEL_GUIDES = [
  {
    name: 'OpenAI 官方 / 相容介面',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    models: 'gpt-4o, gpt-4o-mini, o1, o3-mini',
    notes: '官方端點請填入 sk-... 憑證；若使用中轉服務請將 Base URL 替換為中轉端點。'
  },
  {
    name: 'Anthropic Claude',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: 'claude-3-7-sonnet-20250219, claude-3-5-haiku-20241022',
    notes: '支援擴展思考推理（Thinking），長文理解與版面排版指令遵循能力極佳。'
  },
  {
    name: 'Google Gemini',
    provider: 'gemini',
    baseUrl: '內建端點',
    models: 'gemini-2.0-flash, gemini-1.5-pro',
    notes: '從 Google AI Studio 取得 API Key，速度極快且上下文窗口大。'
  },
  {
    name: 'DeepSeek',
    provider: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    models: 'deepseek-chat (V3), deepseek-reasoner (R1)',
    notes: '高性價比。注意 DeepSeek 純文字模型不具備多模態視覺能力，識圖大綱建議搭配視覺模型。'
  },
  {
    name: 'Ollama (本地離線部署)',
    provider: 'openai',
    baseUrl: 'http://127.0.0.1:11434/v1',
    models: 'qwen2.5-coder:14b, qwen2.5-coder:32b, deepseek-r1:14b',
    notes: '完全離線、零網路、資料不離機。API Key 填入任意字串（如 ollama）即可。'
  },
  {
    name: '通義千問 (Aliyun DashScope)',
    provider: 'openai',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: 'qwen-plus, qwen-max, qwen2.5-coder-32b-instruct',
    notes: '國內網路直連無延遲，程式碼與結構化輸出能力穩定。'
  }
]

const THINKING_CONFIGS = [
  {
    title: 'DeepSeek R1',
    desc: '預設會主動輸出推理思考內容，無需額外參數。建議調整較大的 max_tokens：',
    json: '{\n  "max_tokens": 8000\n}'
  },
  {
    title: 'OpenAI o1 / o3-mini',
    desc: '支援透過 reasoning_effort 調節思考強度（low / medium / high）：',
    json: '{\n  "reasoning_effort": "medium"\n}'
  },
  {
    title: 'Claude 3.7 Sonnet (Thinking)',
    desc: '開啟延伸思考模式並設定思考 token 預算：',
    json: '{\n  "thinking": {\n    "type": "enabled",\n    "budget_tokens": 4000\n  }\n}'
  },
  {
    title: 'Google Gemini 2.0 Flash (Thinking)',
    desc: '設定思考預算（0 為關閉思考，1~8192 為自訂預算）：',
    json: '{\n  "thinkingBudget": 4000\n}'
  },
  {
    title: 'Qwen2.5 / 3 (vLLM / SGLang 自建服務)',
    desc: '若自建後端支援 chat_template_kwargs 思考參數：',
    json: '{\n  "chat_template_kwargs": {\n    "enable_thinking": true\n  }\n}'
  }
]

export function HelpPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'faq'
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number): void => {
    void navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const filteredFaq = FAQ_ITEMS.filter(
    (item) =>
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">說明與文件中心</h1>
          <p className="text-sm text-muted-foreground">
            Oh My PPT Windows 11 原生維護版完整使用手冊、模型配置指南與疑難排解。
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 md:w-[460px]">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            常見問題 FAQ
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            模型配置教學
          </TabsTrigger>
          <TabsTrigger value="thinking" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            思考模型參數
          </TabsTrigger>
        </TabsList>

        {/* 1. FAQ TAB */}
        <TabsContent value="faq" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋常見問題..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4">
            {filteredFaq.map((item, i) => (
              <Card key={i} className="p-5 transition-shadow hover:shadow-sm">
                <h3 className="text-base font-semibold text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </Card>
            ))}
            {filteredFaq.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                查無相關問題，請嘗試搜尋其他關鍵字。
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. MODELS TAB */}
        <TabsContent value="models" className="space-y-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
            💡 <strong>解耦提示</strong>：Oh My PPT 的「文字生成大綱」與「AI 繪圖配圖」為兩套獨立配置。您可使用任一文字模型規劃大綱，同時使用其他生圖服務產出插圖與背景。
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MODEL_GUIDES.map((guide, i) => (
              <Card key={i} className="flex flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{guide.name}</h3>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {guide.provider}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Base URL：</span>
                      <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono">{guide.baseUrl}</code>
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">推薦模型：</span>
                      <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono">{guide.models}</code>
                    </p>
                    <p className="pt-1 text-muted-foreground">{guide.notes}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3. THINKING TAB */}
        <TabsContent value="thinking" className="space-y-6">
          <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
            當您使用具備推理過程（Reasoning / Thinking）的模型時，可以在「設定 → 模型配置」中展開「自訂請求參數 (JSON)」，貼上以下參數微調推理預算。
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {THINKING_CONFIGS.map((item, idx) => (
              <Card key={idx} className="relative flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.json, idx)}
                      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      title="複製 JSON"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>複製</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <pre className="mt-3 overflow-x-auto rounded bg-muted/70 p-3 font-mono text-xs text-foreground">
                  {item.json}
                </pre>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default HelpPage
