# AGENTS.md

> [!IMPORTANT]
> 請先完整閱讀並遵守 [`FORK.md`](FORK.md)。本 fork 採 **Windows 11 原生** 維護：
> - **PR、push、release 一律指向 `SanHsien/oh-my-ppt`**，嚴禁未經當次許可打向 `arcsin1/oh-my-ppt`。
> - 每個 clone 先確認 `gh repo set-default SanHsien/oh-my-ppt`。
> - 開 PR 明寫 `--repo SanHsien/oh-my-ppt` 並核對輸出的 URL。
> - 提交前跑 `pwsh -NoProfile -File tools\dev_check.ps1`。
> - 產品程式在 `src/`，以上游為準；不要移除 `upstream`、原作者或 Apache-2.0 授權標示。
> - 測試簡報、模型 API key、個人 Prompt、`.env` 一律不可提交。
> - 下文為上游產品架構與 React 元件開發指引；衝突時以 `FORK.md` 為準。

---

> 不要跑 `npm run lint`。
> 不要跑 `npm run build`。

## Project

Electron 桌面應用，主進程 (`src/main/`) + 渲染進程 (`src/renderer/`) + 共享類型 (`src/shared/`)。

## Code Style

- `singleQuote`, `no semi`, `printWidth: 100`, `trailingComma: none`
- 路徑別名: `@shared/*`, `@renderer/*`

## Execution Rules

- 先定位變更屬於生成、編輯、導入、導出還是運行時；不要只修單一路徑
- 公共規則改動要同時確認生成與編輯鏈路是否覆蓋，尤其是整頁編輯、deck 編輯、selector 編輯
- 改運行時資源時，同步確認 session asset 相容/刷新機制
- 修 bug 時優先補定向回歸測試，覆蓋當前問題和相鄰入口
- 驗證優先跑最小相關測試；不要跑 `npm run lint` 或 `npm run build`

## Testing

- 框架：Vitest + happy-dom，測試檔案放 `tests/unit/` 下，按功能域分子目錄，檔名 `*.test.ts`
- 跑測試：`pnpm test`，跑單個檔案：`pnpm test -- tests/unit/xxx/foo.test.ts`
- 修 bug 或加功能時，必須補對應測試到 `tests/unit/`；測試不通過就繼續修代碼直到通過
- 注意：樣式 UI 改動不需要寫測試

## React 組件編寫規範

### 核心原則

#### 1. 邏輯內聚，少傳 props
- **能寫在組件內的邏輯就寫在組件內**，不要通過 props 從父組件傳進來
- 事件處理、資料獲取、狀態管理，都優先寫在組件自己裡面

```jsx
// ✅ 好
function ProductCard({ id }) {
  const [count, setCount] = useState(0)
  const handleBuy = () => { /* 邏輯寫這裡 */ }
  return <button onClick={handleBuy}>購買</button>
}

// ❌ 壞
function ProductCard({ count, onBuy }) { /* 邏輯都從外面傳 */ }
```

#### 2. 跨組件狀態用 Zustand
- 多個組件需要共享的資料 → 放 zustand store
- 不要通過 props 一層層傳

```jsx
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))

// 任何組件直接拿來用，不用傳 props
const user = useStore(state => state.user)
```

#### 3. 複用邏輯抽成自訂 Hook
- 多個組件都需要**相同的有狀態邏輯**時，抽成自訂 Hook
- Hook 放在 `hooks/` 目錄下，以 `use` 開頭

```jsx
// hooks/useProductData.js
function useProductData(productId) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchProduct(productId).then(setProduct)
  }, [productId])
  
  return { product, loading }
}

// 組件中使用
function ProductCard({ id }) {
  const { product, loading } = useProductData(id)
  // 不用從 props 傳 product 和 loading
}
```

#### 4. 什麼情況才用 props？
只傳這兩類東西：
- **配置項**：`size`, `disabled`, `variant`
- **純展示資料**：`title`, `description`

## 簡單檢查
寫代碼前問一句：*"這個邏輯/狀態能不能直接寫在當前組件裡？"*
- 能 → 就寫裡面
- 不能，但多個組件都需要 → 放 zustand 或抽成自訂 Hook
- 實在不行 → 才傳 props

## 記住
**組件要自己管自己，別當父組件的提線木偶。**
