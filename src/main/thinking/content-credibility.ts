export interface CredibilityIssue {
  line: number
  text: string
  reason: string
}

const BENCHMARK_PATTERN = /\b(MMLU|HumanEval|MT-Bench|SWE-bench|GSM8K|GPQA|BIG-bench)\b/i
const METRIC_WORD_PATTERN =
  /成本|價格|準確率|召回率|錯誤率|幻覺|提升|下降|降低|縮短|節省|突破|達到|保持|超過|優化|損失|參數|token|fps|benchmark|score|accuracy|cost|latency|throughput/i
const EXACT_VALUE_PATTERN =
  /(?:[$￥]\s*\d|\d+(?:\.\d+)?\s*(?:%|美元|元|倍|fps|K|M|B|T|萬|億|千億|萬億|token|tokens?)|\b\d+(?:\.\d+)?\s*(?:->|→|至|-)\s*\d+(?:\.\d+)?)/i

export function findUnsupportedPrecisionClaims(args: {
  markdown: string
  hasSources: boolean
}): CredibilityIssue[] {
  if (args.hasSources) return []

  const issues: CredibilityIssue[] = []
  const lines = args.markdown.split('\n')

  lines.forEach((line, index) => {
    const text = line.trim()
    if (!text || isAllowedStructuralNumber(text)) return

    const hasExactValue = EXACT_VALUE_PATTERN.test(text)
    const hasBenchmark = BENCHMARK_PATTERN.test(text) && /\d/.test(text)
    const hasMetricWord = METRIC_WORD_PATTERN.test(text)

    if ((hasExactValue && hasMetricWord) || hasBenchmark) {
      issues.push({
        line: index + 1,
        text,
        reason: hasBenchmark
          ? 'benchmark score without source support'
          : 'exact metric without source support'
      })
    }
  })

  return issues
}

function isAllowedStructuralNumber(text: string): boolean {
  return (
    /^##\s*Page\s+\d+\s*:/.test(text) ||
    /^##\s*Page Count$/i.test(text) ||
    /^\d+$/.test(text) ||
    /時長|分鐘|頁|頁面數|Page Count/i.test(text)
  )
}
