export type AppLocale = 'zh' | 'en'

export type ProgressStatusKey =
  | 'understanding'
  | 'planning'
  | 'preparing'
  | 'generating'
  | 'checking'
  | 'retrying'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled'

const PROGRESS_TEXT: Record<ProgressStatusKey, Record<AppLocale, string>> = {
  understanding: {
    zh: '理解需求',
    en: 'Understanding request'
  },
  planning: {
    zh: '規劃結構',
    en: 'Planning structure'
  },
  preparing: {
    zh: '準備畫布',
    en: 'Preparing canvas'
  },
  generating: {
    zh: '生成頁面',
    en: 'Generating pages'
  },
  checking: {
    zh: '檢查頁面',
    en: 'Checking pages'
  },
  retrying: {
    zh: '正在重試',
    en: 'Retrying'
  },
  finalizing: {
    zh: '正在收尾',
    en: 'Finalizing'
  },
  completed: {
    zh: '已完成',
    en: 'Completed'
  },
  failed: {
    zh: '已失敗',
    en: 'Failed'
  },
  canceled: {
    zh: '已取消',
    en: 'Canceled'
  }
}

const LABEL_MAP: Array<[RegExp, ProgressStatusKey]> = [
  [/取消|cancel/i, 'canceled'],
  [/失敗|錯誤|fail|error/i, 'failed'],
  [/重試|retry/i, 'retrying'],
  [/完成|已生成|已更新|已創建|complete|completed|done|generated|updated|created/i, 'completed'],
  [/檢查|驗證|校驗|check|verif|validation/i, 'checking'],
  [/規劃|結構|大綱|整理.*大綱|plan|structur|outline/i, 'planning'],
  [/畫布|準備|本地.*就緒|canvas|prepar|ready/i, 'preparing'],
  [/理解|分析|understand|analyz/i, 'understanding'],
  [/生成|寫入|更新|填充|generate|generating|writing|updating|filling/i, 'generating'],
  [/收尾|finaliz/i, 'finalizing']
]

export const normalizeLocale = (locale: AppLocale | undefined): AppLocale =>
  locale === 'en' ? 'en' : 'zh'

export const progressText = (locale: AppLocale | undefined, key: ProgressStatusKey): string =>
  PROGRESS_TEXT[key][normalizeLocale(locale)]

export const normalizeProgressLabel = (rawLabel: string | undefined): ProgressStatusKey => {
  const label = (rawLabel || '').trim()
  if (!label) return 'generating'
  for (const [pattern, key] of LABEL_MAP) {
    if (pattern.test(label)) return key
  }
  return 'generating'
}

export const progressLabel = (
  locale: AppLocale | undefined,
  rawLabel: string | undefined
): string => progressText(locale, normalizeProgressLabel(rawLabel))

export const progressDisplayLabel = (
  locale: AppLocale | undefined,
  rawLabel: string | undefined
): string => {
  const label = (rawLabel || '').trim()
  if (/^(?:P\d+\b|第\s*\d+\s*頁)/i.test(label)) return label
  return progressLabel(locale, label)
}
