/**
 * Script-tolerant matching for Chinese intent patterns.
 *
 * The source tree was converted to Traditional Chinese with a table that prefers a few variant glyphs
 * (為 -> 爲, 才 -> 纔, 啟 -> 啓, 眾 -> 衆 ...). Patterns written with those glyphs stop matching what
 * people really type: Taiwan-standard text (改為, 剛才) and Simplified text (改为, 刚才), both of which the
 * upstream patterns accepted. Wrapping a pattern with `hanTolerant` widens every listed character to
 * its whole variant group, so a pattern can be written once, in either script.
 *
 * Only the characters in `VARIANT_GROUPS` are widened; everything else is left untouched. Add a group
 * here when a new user-facing pattern needs one.
 */
const VARIANT_GROUPS: readonly string[] = [
  // Glyph variants inside Traditional Chinese (the converted source prefers the first-listed variant)
  '為爲为',
  '才纔',
  '裡裏里',
  '周週',
  '佈布',
  '眾衆众',
  '啟啓启',
  // Traditional <-> Simplified, limited to the characters used by the wrapped patterns
  '個个', '優优', '兩两', '刪删', '剛刚', '劃划', '動动', '單单', '問问', '圍围', '圖图', '執执',
  '報报', '專专', '幾几', '張张', '彙汇', '後后', '從从', '應应', '擊击', '條条', '業业', '構构',
  '標标', '樣样', '檔档', '況况', '潔洁', '潤润', '現现', '盤盘', '確确', '節节', '簡简', '級级',
  '細细', '結结', '綱纲', '總总', '繼继', '續续', '處处', '製制', '複复', '覆复', '規规', '觀观',
  '計计', '設设', '認认', '調调', '請请', '輸输', '這这', '還还', '邊边', '開开', '隱隐', '順顺',
  '頁页', '頭头', '題题', '顏颜', '顯显', '風风', '體体', '錄录', '換换', '變变', '當当', '內内',
  '點点', '說说', '歷历', '會会', '記记', '時时', '將将', '對对', '無无', '關关', '選选', '導导'
]

const VARIANTS = (() => {
  const map = new Map<string, Set<string>>()
  for (const group of VARIANT_GROUPS) {
    const chars = Array.from(group)
    if (chars.length < 2) continue
    for (const ch of chars) {
      const set = map.get(ch) ?? new Set<string>()
      for (const other of chars) set.add(other)
      map.set(ch, set)
    }
  }
  return map
})()

/**
 * Return a copy of `pattern` in which every character that has script variants matches all of them.
 * Characters inside a bracket class get the variants appended to the class; characters outside one are
 * replaced by a small class. Escapes, groups, quantifiers and flags are preserved.
 */
export function hanTolerant(pattern: RegExp): RegExp {
  const source = pattern.source
  let out = ''
  let inClass = false
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '\\') {
      out += ch + (source[i + 1] ?? '')
      i += 1
      continue
    }
    if (inClass) {
      if (ch === ']') inClass = false
      const variants = VARIANTS.get(ch)
      // A literal range such as 一-十 must not be split by inserted characters.
      const isRangeEndpoint = source[i - 1] === '-' || source[i + 1] === '-'
      out += variants && !isRangeEndpoint ? Array.from(variants).join('') : ch
      continue
    }
    if (ch === '[') {
      inClass = true
      out += ch
      if (source[i + 1] === '^') {
        out += '^'
        i += 1
      }
      continue
    }
    const variants = VARIANTS.get(ch)
    out += variants ? `[${Array.from(variants).join('')}]` : ch
  }
  return new RegExp(out, pattern.flags)
}
