import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  dialog: { showOpenDialog: vi.fn() },
  ipcMain: { handle: vi.fn() }
}))

import {
  CHART_DATA_EXTENSIONS,
  parseChartDataFile
} from '../../../src/main/element-editor/chart-data-import'

describe('chart data import formats', () => {
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  async function tempFile(name: string, content: string): Promise<string> {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ohmyppt-chart-import-'))
    roots.push(dir)
    const file = path.join(dir, name)
    await writeFile(file, content)
    return file
  }

  it('does not offer legacy .xls in the file picker (exceljs reads .xlsx only)', () => {
    expect(CHART_DATA_EXTENSIONS).toContain('xlsx')
    expect(CHART_DATA_EXTENSIONS).not.toContain('xls')
  })

  it('rejects legacy .xls with a save-as-xlsx hint', async () => {
    const file = await tempFile('legacy.xls', 'not a real workbook')
    await expect(parseChartDataFile(file)).rejects.toThrow('.xlsx')
  })

  it('still parses csv', async () => {
    const file = await tempFile('data.csv', 'month,sales\nJan,10\nFeb,20\n')
    const result = await parseChartDataFile(file)
    expect(result.canceled).toBe(false)
    expect(result.rowCount).toBe(2)
  })

  it('reads rich text, hyperlink, formula and date cells of an xlsx as their text and values', async () => {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('data')
    sheet.addRow(['month', 'sales'])
    sheet.addRow([{ richText: [{ text: 'Jan' }] }, 10])
    sheet.addRow([{ text: 'Feb', hyperlink: 'https://example.com' }, { formula: '10+10', result: 20 }])
    sheet.addRow([new Date(Date.UTC(2026, 2, 1)), 30])
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ohmyppt-chart-import-'))
    roots.push(dir)
    const file = path.join(dir, 'data.xlsx')
    await workbook.xlsx.writeFile(file)

    const result = await parseChartDataFile(file)
    const rows = JSON.parse(result.dataJson as string) as Array<Record<string, unknown>>

    expect(rows.map((row) => row.x)).toEqual(['Jan', 'Feb', '2026-03-01'])
    expect(JSON.stringify(rows)).not.toContain('[object Object]')
  })

  it('recognizes a Simplified first header like its Traditional twin', async () => {
    // Only the numeric header row decides here, so the first cell must be read as a header word.
    for (const header of ['產品', '产品']) {
      const file = await tempFile(`${header}.csv`, `${header},2021,2022\nA,1,2\nB,3,4\n`)
      const result = await parseChartDataFile(file)
      expect(result.rowCount, header).toBe(2)
    }
  })
})
