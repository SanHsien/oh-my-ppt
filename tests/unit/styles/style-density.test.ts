import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const stylesRoot = path.join(projectRoot, 'resources/styles')

const listBuiltinStyleSkillFiles = () =>
  readdirSync(stylesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(stylesRoot, entry.name, 'SKILL.md'))
    .filter((filePath) => {
      try {
        readFileSync(filePath, 'utf8')
        return true
      } catch {
        return false
      }
    })

const extractLayoutSection = (markdown: string) => {
  const match = markdown.match(/## 佈局\r?\n([\s\S]*?)(\r?\n## |$)/)
  return (match?.[1] || markdown).replace(/\s+/g, ' ').trim()
}

describe('builtin style density guidance', () => {
  it('does not use style wording that directly encourages overloaded pages', () => {
    const forbidden = [
      '兒童節不怕滿',
      '全屏代碼展示是常態',
      '寧可多塞一行數據',
      '信息密度可以很高',
      '每個數據模塊獨立成卡片',
      '信息宮格化，每個色塊承載一類信息',
      '下方結合卡片宮格',
      '像積木一樣堆疊'
    ]

    for (const filePath of listBuiltinStyleSkillFiles()) {
      const markdown = readFileSync(filePath, 'utf8')
      for (const phrase of forbidden) {
        expect(markdown, `${path.relative(projectRoot, filePath)} should not contain ${phrase}`).not.toContain(
          phrase
        )
      }
    }
  })

  it('pairs card/grid/terminal/table layout cues with explicit breathing-room guidance', () => {
    const riskyCue =
      /(宮格|多面板|終端|代碼|KPI|表格|看板|卡片式佈局|色塊.*分組|模塊化排布|不對稱佈局)/
    const densityBuffer =
      /(留白|呼吸|低到中密度|不要.*堆|不要.*塞|不要.*密集|不要默認|避免.*堆|避免.*塞|避免.*密集|由內容|按內容|可讀|剋制|少量|必要信息)/

    for (const filePath of listBuiltinStyleSkillFiles()) {
      const layout = extractLayoutSection(readFileSync(filePath, 'utf8'))
      if (!riskyCue.test(layout)) continue

      expect(layout, `${path.relative(projectRoot, filePath)} has risky layout cues`).toMatch(
        densityBuffer
      )
    }
  })

  it('keeps dreamy-romance sparse for data-heavy report pages', () => {
    const dreamy = readFileSync(path.join(stylesRoot, 'dreamy-romance/SKILL.md'), 'utf8')

    expect(dreamy).toContain('數據、報告或表格型內容也要保持柔和低到中密度')
    expect(dreamy).toContain('不要把每個指標都擴成同等大小的大卡片')
    expect(dreamy).toContain('避免同一事實同時出現在摘要卡、時間軸和說明卡里')
  })
})
