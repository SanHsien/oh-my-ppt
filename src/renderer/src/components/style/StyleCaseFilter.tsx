import * as React from 'react'
import { useMemo } from 'react'
import { buildStyleCaseOptions, type StyleCaseItem } from '@renderer/lib/style-case'
import { cn } from '@renderer/lib/utils'

export type StyleCaseFilterProps = {
  /** 任意帶 styleCase 字段的條目數組（風格列表 / 下拉選項均適用） */
  items: StyleCaseItem[]
  /** 可選候選集：用於禁用當前搜索/收藏條件下不會產生結果的 chip，不影響展示計數 */
  availableItems?: StyleCaseItem[]
  /** 當前選中的用途標籤，空串表示"全部" */
  selected: string
  onSelect: (label: string) => void
  /** "全部" chip 的文案 */
  allLabel: string
  /** 可選標題（如"按適用場景篩選"），不傳則不渲染 */
  title?: string
  /** 外層容器樣式，由調用方決定是卡片還是窄條 */
  className?: string
}

const chipClassName = (active: boolean): string =>
  cn(
    'rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
    active
      ? 'border-[#97aa7c] bg-[#dbe7ca] text-[#2f3b28] dark:border-[#527445] dark:bg-[#344d2b] dark:text-[#ffffff] dark:shadow-sm'
      : 'border-[#d6c08d]/80 bg-white/70 text-[#7c6a4c] hover:bg-[#fff3d8] dark:border-[#35462e] dark:bg-[#20291f] dark:text-[#c4d6bd] dark:hover:bg-[#2a3629] dark:hover:text-[#ffffff]'
  )

/**
 * 用途（styleCase）篩選 chip 欄。風格庫頁與風格下拉共用，保證兩處分類一致。
 * 規則與 styles.tsx 原實現一致：只展示命中數 > 1 的用途，並保證當前選中項始終可見。
 */
export function StyleCaseFilter({
  items,
  availableItems,
  selected,
  onSelect,
  allLabel,
  title,
  className
}: StyleCaseFilterProps): React.JSX.Element | null {
  const options = useMemo(() => buildStyleCaseOptions(items), [items])
  const availableLabels = useMemo(() => {
    if (!availableItems) return null
    return new Set(buildStyleCaseOptions(availableItems).map((option) => option.label))
  }, [availableItems])
  const visible = useMemo(() => {
    const popular = options.filter((option) => option.count > 1)
    const matched = options.find((option) => option.label === selected)
    return matched && !popular.some((option) => option.label === matched.label)
      ? [...popular, matched]
      : popular
  }, [options, selected])

  if (options.length === 0) return null

  return (
    <div className={className}>
      {title ? <p className="mb-2 text-xs font-medium text-[#3e4a32] dark:text-[#e4eedf]">{title}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={chipClassName(selected === '')} onClick={() => onSelect('')}>
          {`${allLabel} · ${items.length}`}
        </button>
        {visible.map((option) => (
          <button
            key={option.label}
            type="button"
            className={chipClassName(selected === option.label)}
            disabled={selected !== option.label && availableLabels ? !availableLabels.has(option.label) : false}
            onClick={() => onSelect(option.label)}
          >
            {`${option.label} · ${option.count}`}
          </button>
        ))}
      </div>
    </div>
  )
}
