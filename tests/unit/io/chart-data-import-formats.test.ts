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
})
