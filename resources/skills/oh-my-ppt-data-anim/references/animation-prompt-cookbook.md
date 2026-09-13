# 動畫提示詞速查手冊

直接複製、直接用。每條提示詞都能在 Oh My PPT 裏穩定生成對應動畫，且可導出爲可編輯 PPTX。

---

## 入場動畫（元素出現）

### fade — 純淡入

最安靜的方式，文字、註釋、輔助信息首選。

```html
<p data-anim="fade">輔助說明文字</p>
```

視覺：從透明漸變到可見，沒有位移。像一個聲音從遠處慢慢變清晰。

---

### fade-up — 標準上浮淡入

最常用的入場動畫。卡片、標題、列表項默認選它。

```html
<h2 data-anim="fade-up">季度營收</h2>
<p data-anim="fade-up" data-anim-stagger="90">用戶增長 42%</p>
<p data-anim="fade-up" data-anim-stagger="90">留存率 86%</p>
```

視覺：從下方 20px 處一邊上移一邊淡入。像卡片從桌面浮起。

---

### fade-down — 下沉淡入

從上方落下，適合倒計時、從頂部"降落"的信息。

```html
<div data-anim="fade-down">⏱ 倒計時 3 秒</div>
```

視覺：從上方 20px 處下移 + 淡入。像紙片從上方飄落到位。

---

### fade-left / fade-right — 側向淡入

從右側 / 左側滑入淡入。適合對比佈局的左右兩欄。

```html
<div class="grid grid-cols-2 gap-6">
  <div data-anim="fade-left">當前方案</div>
  <div data-anim="fade-right">優化方案</div>
</div>
```

視覺：fade-left 從右側 20px 滑入，fade-right 從左側 20px 滑入。像兩張卡片各從一側合攏。

---

### scale-in — 縮放淡入

比 zoom-in 溫和，從 85% 放大到 100% + 淡入。適合圖標、小卡片。

```html
<div data-anim="scale-in">🧩 核心模塊</div>
```

視覺：從小一點點放大到正常尺寸 + 淡入。像一張照片從縮略圖展開。

---

### slide-up / slide-down — 大幅滑動

比 fade-up 位移更大（40px vs 20px），視覺衝擊更強。適合需要明確"運動感"的場景。

```html
<div data-anim="slide-up">重大公告</div>
<div data-anim="slide-down">下拉刷新提示</div>
```

視覺：slide-up 從下方 40px 大幅上移，slide-down 從上方 40px 大幅下移。比 fade-up 更有"推入"的力量感。

---

### slide-left / slide-right — 大幅側滑

比 fade-left/fade-right 位移更大（40px vs 20px），適合全寬卡片、大面板的入場。

```html
<div data-anim="slide-left">右側面板內容</div>
<div data-anim="slide-right">左側面板內容</div>
```

視覺：slide-left 從右側 40px 推入，slide-right 從左側 40px 推入。像抽屜被拉出來。

---

### fly-in — 方向飛入

配合 `data-anim-from` 指定飛行方向。適合指標從屏幕邊緣飛入。

```html
<div data-anim="fly-in" data-anim-from="left">挑戰</div>
<div data-anim="fly-in" data-anim-from="right">方案</div>
<div data-anim="fly-in" data-anim-from="top">頂部指標</div>
<div data-anim="fly-in" data-anim-from="bottom">底部數據</div>
```

視覺：從指定方向 40px 外飛入 + 淡入。像彈幕/飛行文字效果。

> `data-anim-from="center"` 會變成縮放入場（scale 0.9→1），不做位移。

---

### wipe — 擦除顯現

配合 `data-anim-from` 指定擦除方向。適合進度條、時間線段、橫幅。

```html
<div data-anim="wipe" data-anim-from="left">進度 75%</div>
<div data-anim="wipe" data-anim-from="right">反向揭示</div>
<div data-anim="wipe" data-anim-from="top">從頂部展開</div>
<div data-anim="wipe" data-anim-from="bottom">從底部展開</div>
```

視覺：clip-path 從一側裁切區域逐漸展開到全部可見。像幕布被拉開。

---

### zoom-in — 強力縮放

從 75% 放大到 100% + 淡入，視覺衝擊最大。適合英雄數字、關鍵指標。

```html
<div data-anim="zoom-in" data-anim-duration="800">
  <p class="text-5xl font-bold">42%</p>
  <p class="text-lg text-gray-500">市場增長率</p>
</div>
```

視覺：從遠到近快速放大 + 淡入。像電影裏的"推鏡頭"。

---

### spin-in — 旋轉縮放

旋轉 -12° + 縮放 92%→100% + 淡入。有趣但不宜多用。

```html
<div data-anim="spin-in" data-anim-duration="600">🎯 目標達成</div>
```

視覺：微微旋轉着放大到位。像陀螺停下來的感覺。

---

### path — 路徑運動

沿線性路徑移動，適合圖示流動、箭頭動畫。

```html
<div data-anim="path" data-anim-path="M 0 0 L 120 30">→ 流向目標</div>
<div data-anim="path" data-anim-path="M 0 0 L -80 -60">↖ 回溯</div>
<div data-anim="path" data-anim-path="M 0 0 L 0 -150">↑ 上升</div>
```

視覺：沿指定直線方向平移。`M 0 0 L 120 30` 表示向右 120px、向下 30px。

> 路徑格式只支持 `M x y L dx dy`，不支持曲線。小數也可以：`M 0 0 L 12.5 3.25`。

---

## 強調動畫（元素已在屏幕上）

強調動畫不會改變元素的可見性，只是讓它"動一下"吸引注意。播放後元素回到原位。

### pulse-soft — 極輕柔脈衝

幾乎察覺不到的縮放（1→1.03→1），適合 KPI 數字打磨、低調提示。

```html
<div data-anim="pulse-soft" data-anim-duration="600">
  <p class="text-2xl font-semibold">99.9%</p>
  <p class="text-lg text-gray-500">可用性</p>
</div>
```

視覺：微微鼓起一點點然後復原，不仔細看幾乎感覺不到。

---

### pulse — 標準脈衝

縮放 1→1.06→1，適合關鍵指標、需要溫和但明確關注的內容。

```html
<div data-anim="pulse" data-anim-duration="600">
  <p class="text-xl font-bold text-red-600">關鍵風險</p>
  <p class="text-lg">Q3 前需行動</p>
</div>
```

視覺：輕輕鼓起再縮回，像心跳一下。

---

### pulse-strong — 強脈衝

縮放 1→1.10→1，視覺上明顯放大。適合緊急告警、需立即關注的內容。

```html
<div data-anim="pulse-strong" data-anim-trigger="click">
  <p class="text-xl font-bold text-red-700">⚠ 緊急</p>
</div>
```

視覺：明顯放大再彈回，像被戳了一下。配合 click 觸發效果更好。

---

### grow-shrink-soft — 溫和縮放

先縮小到 0.95，再放大到 1.04，回到 1。像"深呼吸一下"的感覺。

```html
<div data-anim="grow-shrink-soft" data-anim-duration="800">確認提交</div>
```

視覺：先微縮再微擴再復原，有呼吸感。

---

### grow-shrink — 標準縮放

先縮小到 0.9，再放大到 1.08，回到 1。比 grow-shrink-soft 明顯。

```html
<div data-anim="grow-shrink" data-anim-duration="800">重要提醒</div>
```

視覺：先縮小再放大再復原，像彈簧壓下去再彈回來。

---

### grow-shrink-strong — 強力縮放

先縮小到 0.85，再放大到 1.12，回到 1。視覺衝擊最強的強調動畫。

```html
<div data-anim="grow-shrink-strong" data-anim-duration="900">
  <p class="text-3xl font-bold">里程碑達成！</p>
</div>
```

視覺：大幅縮小再大幅放大再復原，很有戲劇感。慎用，一頁最多一處。

---

## 退場動畫（元素離開）

### exit-fade — 淡出

最安靜的離場方式。

```html
<div data-anim="exit-fade" data-anim-duration="400">舊內容消失</div>
```

視覺：從可見漸變到透明。像畫面慢慢隱去。

---

### exit-scale — 縮小淡出

溫和的縮放離場（scale 1→0.85 + fade out），適合低調移除次要元素。

```html
<div data-anim="exit-scale">已完成項</div>
```

視覺：微微縮小 + 淡出。像一張卡片悄悄收起。

---

### exit-zoom — 強縮放離場

強力縮放離場（scale 1→0.75 + fade out），戲劇感強。

```html
<div data-anim="exit-zoom" data-anim-duration="600">主角退場</div>
```

視覺：大幅縮小 + 淡出。像鏡頭急速拉遠。

---

### exit-wipe — 擦除退場

配合 `data-anim-from` 指定擦除方向。適合橫幅消失、進度條歸零。

```html
<div data-anim="exit-wipe" data-anim-from="left">橫幅消失</div>
<div data-anim="exit-wipe" data-anim-from="right">向右擦除</div>
```

視覺：clip-path 從可見逐漸裁切到隱藏。像幕布合上。

---

### exit-fly — 飛出

配合 `data-anim-from` 指定飛出方向。

```html
<div data-anim="exit-fly" data-anim-from="left">向左飛出</div>
<div data-anim="exit-fly" data-anim-from="right">向右飛出</div>
<div data-anim="exit-fly" data-anim-from="top">向上飛出</div>
<div data-anim="exit-fly" data-anim-from="bottom">向下飛出</div>
```

視覺：沿指定方向飛出屏幕 + 淡出。像彈幕飛走。

---

## 組合模式

### 交錯卡片陣列

多張卡片依次入場，每張間隔 90ms。

```html
<div class="grid grid-cols-3 gap-4">
  <div data-anim="fade-up" data-anim-stagger="90">
    <p class="text-3xl font-bold">$12M</p>
    <p class="text-lg text-gray-500">營收</p>
  </div>
  <div data-anim="fade-up" data-anim-stagger="90">
    <p class="text-3xl font-bold">86%</p>
    <p class="text-lg text-gray-500">留存</p>
  </div>
  <div data-anim="fade-up" data-anim-stagger="90">
    <p class="text-3xl font-bold">2.4x</p>
    <p class="text-lg text-gray-500">ROI</p>
  </div>
</div>
```

交錯節奏參考：
- 60–80ms：緊湊、有活力（適合指標卡、小卡片）
- 90–120ms：舒適、從容（適合列表項、步驟）
- 150–200ms：戲劇、緩慢（適合關鍵論點、章節段落）

---

### 標題 + 內容 序列

標題先入場，輔助內容同時出現（with），證據卡片在標題完成後出現（after）。

```html
<h2 data-anim="fade-up" data-anim-duration="600">核心洞察</h2>
<p data-anim="fade" data-anim-sequence="with" data-anim-delay="80" data-anim-duration="500">
  輔助說明隨標題一同出現
</p>
<div data-anim="fade-up" data-anim-sequence="after" data-anim-duration="500">
  證據卡片在標題完成後出現
</div>
```

---

### 對比飛入

左右兩欄分別從兩側飛入。

```html
<div class="grid grid-cols-2 gap-6">
  <div data-anim="fly-in" data-anim-from="left">
    <h3>挑戰</h3>
    <p>傳統方法力不從心</p>
  </div>
  <div data-anim="fly-in" data-anim-from="right">
    <h3>方案</h3>
    <p>我們直接解決了這個問題</p>
  </div>
</div>
```

---

### 英雄數字 + 支撐卡片

大數字用 zoom-in 強調，小卡片用 fade-up 交錯入場。

```html
<div class="flex flex-col gap-6">
  <div data-anim="zoom-in" data-anim-duration="800">
    <p class="text-5xl font-bold">42%</p>
    <p class="text-lg text-gray-500">市場增長</p>
  </div>
  <div class="grid grid-cols-3 gap-4">
    <div data-anim="fade-up" data-anim-stagger="80">卡片 1</div>
    <div data-anim="fade-up" data-anim-stagger="80">卡片 2</div>
    <div data-anim="fade-up" data-anim-stagger="80">卡片 3</div>
  </div>
</div>
```

---

### 點擊分步揭示

用 click 觸發一步一步展示內容，適合演講演示。

```html
<div data-anim="fade-up" data-anim-trigger="click" data-anim-click-group="step-1">
  第一步：發現問題
</div>
<div data-anim="pulse-soft" data-anim-trigger="click" data-anim-click-group="step-1">
  關鍵指標
</div>
<div data-anim="fade-up" data-anim-trigger="click">
  第二步：分析原因
</div>
<div data-anim="fade-up" data-anim-trigger="click">
  第三步：執行方案
</div>
```

- `click-group="step-1"`：兩個元素在同一次點擊時一起出現
- 後續無 click-group 的元素各佔一次點擊

---

### 強調 + 確認

先標記風險（pulse），再確認應對（grow-shrink-soft）。

```html
<div data-anim="pulse" data-anim-duration="600">
  <p class="text-xl font-bold text-red-600">風險提示</p>
</div>
<div data-anim="grow-shrink-soft" data-anim-duration="800">
  <p class="text-lg text-green-600">已有應對方案</p>
</div>
```

---

### 入場 → 強調 → 退場 完整生命週期

一個元素先入場、後強調、最後退場。

```html
<div data-anim="fade-up" data-anim-duration="500">
  <p>臨時通知</p>
</div>
<div data-anim="pulse-strong" data-anim-trigger="click" data-anim-click-group="notice">
  <p>臨時通知</p>
</div>
<div data-anim="exit-fade" data-anim-trigger="click" data-anim-duration="300">
  <p>臨時通知</p>
</div>
```

---

## 提示詞複製模板

以下是直接可用的提示詞，在生成幻燈片時粘貼到指令中：

### 模板 1：標準商務彙報

```
給所有卡片加 fade-up 入場動畫，交錯 100ms。標題用 zoom-in 800ms。關鍵指標用 pulse 強調。
```

### 模板 2：數據儀表盤

```
指標卡片用 fly-in from bottom，交錯 80ms。大數字用 zoom-in 800ms 強調。
低於預期的指標用 pulse-strong 標紅提醒。進度條用 wipe from left。
```

### 模板 3：對比分析

```
左側用 fly-in from left，右側用 fly-in from right，同時入場形成對比。
核心差異用 grow-shrink 強調。總結用 scale-in 入場。
```

### 模板 4：逐步演示

```
所有要點用 click 觸發，每點 fade-up 入場。
同一組的相關元素用 click-group 合併到同一次點擊。
最後結論用 zoom-in + pulse-strong 組合強調。
```

### 模板 5：溫和敘述

```
標題用 fade-up 600ms，正文用 fade 入場。
段落之間用 data-anim-sequence="after" 形成自然閱讀節奏。
關鍵詞用 pulse-soft 輕柔提示。
```

### 模板 6：戲劇性發布

```
主數字用 zoom-in 800ms 入場後接 pulse-strong 強調。
支撐論據用 slide-up 交錯 120ms。
舊數據用 exit-scale 退場，新數據用 fly-in from bottom 入場。
```

### 模板 7：流程圖示

```
流程節點沿路徑入場：用 path 動畫，每個節點從上一個節點方向滑入。
關鍵節點用 grow-shrink 強調。完成節點用 exit-fade 淡出。
箭頭用 wipe from left 表示方向。
```

---

## 動畫選擇速查表

| 我想讓元素… | 選這個 | 理由 |
|---|---|---|
| 安靜地出現 | `fade` | 不動，只淡入 |
| 從下方浮起 | `fade-up` | 最通用，卡片/標題默認 |
| 大幅推入 | `slide-up` | 比 fade-up 力度大一倍 |
| 從特定方向飛入 | `fly-in` + `from` | 方向感強，適合指標 |
| 幕布般揭開 | `wipe` + `from` | 適合進度條、橫幅 |
| 從遠到近放大 | `zoom-in` | 英雄數字、關鍵數據 |
| 微妙縮放 | `scale-in` | 比 zoom-in 溫和 |
| 轉着圈進來 | `spin-in` | 有趣但別多用 |
| 沿指定路線移動 | `path` | 流程圖、箭頭 |
| 輕輕鼓一下 | `pulse-soft` | 幾乎感覺不到 |
| 心跳一下 | `pulse` | 溫和但明確的強調 |
| 被戳一下 | `pulse-strong` | 緊急告警 |
| 深呼吸 | `grow-shrink-soft` | 先縮再擴再復原 |
| 彈簧壓放 | `grow-shrink` | 比 soft 明顯 |
| 大幅彈跳 | `grow-shrink-strong` | 最戲劇化的強調 |
| 安靜地消失 | `exit-fade` | 淡出 |
| 縮小消失 | `exit-scale` | 溫和離場 |
| 急速縮小消失 | `exit-zoom` | 強烈離場 |
| 被擦除 | `exit-wipe` + `from` | 幕布合上 |
| 飛走 | `exit-fly` + `from` | 彈幕式離場 |
