/** IPC handler for importing data into a selected chart element. */
import { dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import type { IpcContext } from '../ipc/context'
import type { ParsedChartDataResult } from '../../shared/chart-data'

const require = createRequire(import.meta.url)
const MAX_ROWS = 200
const MAX_SERIES = 8
const X_KEYS = ['x', 'label', 'category', 'name']
const TABLE_X_HEADER_KEYS = [
  ...X_KEYS,
  'date',
  'time',
  'month',
  'quarter',
  'year',
  '日期',
  '時間',
  '月份',
  '季度',
  '年份',
  '分類',
  '類別',
  '名稱',
  '地區',
  '產品'
]

type RawRow = Record<string, unknown> | unknown[]
type ExcelJsApi = {
  Workbook: new () => {
    xlsx: {
      readFile: (filename: string) => Promise<void>
    }
    worksheets: Array<{
      eachRow: (callback: (row: { values: unknown }, rowNumber: number) => void) => void
    }>
  }
}
type PapaApi = {
  parse: (
    input: string,
    options: Record<string, unknown>
  ) => {
    data: unknown[][]
    errors?: Array<{ message?: string }>
  }
}

function loadExcelJs(): ExcelJsApi {
  try {
    return require('exceljs') as ExcelJsApi
  } catch {
    throw new Error('Excel 解析依賴 exceljs 尚未安裝，請先安裝項目依賴')
  }
}

function loadPapa(): PapaApi {
  try {
    return require('papaparse') as PapaApi
  } catch {
    throw new Error('CSV 解析依賴 papaparse 尚未安裝，請先安裝項目依賴')
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = String(value ?? '').trim().replace(/,/g, '')
  if (!text) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeJsonInput(value: unknown): RawRow[] {
  if (Array.isArray(value)) return value as RawRow[]
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const nested = record.data ?? record.rows ?? record.items
    if (Array.isArray(nested)) return nested as RawRow[]
  }
  return []
}

function rowsFromTable(table: unknown[][]): RawRow[] {
  if (table.length === 0) return []
  const firstRow = table[0] || []
  const firstCell = String(firstRow[0] ?? '').trim().toLowerCase()
  const hasHeader =
    TABLE_X_HEADER_KEYS.includes(firstCell) ||
    firstRow.some((cell, index) => index > 0 && toFiniteNumber(cell) === null)
  if (!hasHeader) return table
  const headers = firstRow.map((cell, index) =>
    String(cell || (index === 0 ? 'x' : `Series ${index}`)).trim()
  )
  return table.slice(1).map((row) =>
    headers.reduce<Record<string, unknown>>((record, header, index) => {
      record[header || (index === 0 ? 'x' : `Series ${index}`)] = row[index]
      return record
    }, {})
  )
}

function normalizeChartRows(rows: RawRow[]): {
  rows: Array<Record<string, string | number>>
  seriesCount: number
  labelCount: number
  numericCellCount: number
} {
  const labels: string[] = []
  const rowValues: Array<Record<string, unknown>> = []

  rows.slice(0, MAX_ROWS).forEach((item) => {
    if (Array.isArray(item)) {
      const label = String(item[0] ?? '').trim()
      if (!label) return
      labels.push(label)
      rowValues.push(
        item.slice(1, MAX_SERIES + 1).reduce<Record<string, unknown>>((record, cell, index) => {
          record[index === 0 ? 'Value' : `Series ${index + 1}`] = cell
          return record
        }, {})
      )
      return
    }

    if (!item || typeof item !== 'object') return
    const record = item as Record<string, unknown>
    const keys = Object.keys(record)
    const xKey =
      X_KEYS.find((key) => key in record) ??
      keys.find((key) => toFiniteNumber(record[key]) === null) ??
      keys[0]
    const label = String(record[xKey] ?? '').trim()
    if (!label) return
    labels.push(label)
    rowValues.push(
      keys.reduce<Record<string, unknown>>((row, key) => {
        if (key !== xKey) row[key] = record[key]
        return row
      }, {})
    )
  })

  const seriesKeys = Array.from(new Set(rowValues.flatMap((row) => Object.keys(row))))
    .filter((key) => key.trim() && rowValues.some((row) => toFiniteNumber(row[key]) !== null))
    .slice(0, MAX_SERIES)
  if (seriesKeys.length === 0) {
    return {
      rows: [],
      seriesCount: 0,
      labelCount: labels.length,
      numericCellCount: 0
    }
  }
  let numericCellCount = 0
  const normalizedRows = labels.map((label, rowIndex) => {
    const source = rowValues[rowIndex] || {}
    return seriesKeys.reduce<Record<string, string | number>>(
      (record, key) => {
        const value = toFiniteNumber(source[key])
        if (value !== null) numericCellCount += 1
        record[key] = value ?? 0
        return record
      },
      { x: label }
    )
  })

  return {
    rows: normalizedRows,
    seriesCount: seriesKeys.length,
    labelCount: labels.length,
    numericCellCount
  }
}

async function parseChartDataFile(filePath: string): Promise<ParsedChartDataResult> {
  const ext = path.extname(filePath).toLowerCase()
  let rawRows: RawRow[] = []

  if (ext === '.json') {
    try {
      rawRows = normalizeJsonInput(JSON.parse(await fs.promises.readFile(filePath, 'utf-8')))
    } catch {
      throw new Error('JSON 文件解析失敗，請檢查文件格式')
    }
  } else if (ext === '.csv' || ext === '.tsv' || ext === '.txt') {
    const parsed = loadPapa().parse(await fs.promises.readFile(filePath, 'utf-8'), {
      skipEmptyLines: 'greedy'
    })
    if (parsed.errors?.length) {
      throw new Error(parsed.errors[0].message || 'CSV 文件解析失敗')
    }
    rawRows = rowsFromTable(parsed.data)
  } else if (ext === '.xlsx' || ext === '.xls') {
    const ExcelJS = loadExcelJs()
    const workbook = new ExcelJS.Workbook()
    try {
      await workbook.xlsx.readFile(filePath)
    } catch {
      throw new Error('Excel 文件讀取失敗，請確認檔案格式')
    }
    const worksheet = workbook.worksheets[0]
    if (!worksheet) throw new Error('Excel 文件沒有可讀取的工作表')
    const tableData: unknown[][] = []
    worksheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : []
      tableData.push(
        values.map((v) =>
          v === null || v === undefined
            ? ''
            : typeof v === 'object' && 'result' in (v as Record<string, unknown>)
              ? (v as Record<string, unknown>).result
              : v
        )
      )
    })
    rawRows = rowsFromTable(tableData)
  } else {
    throw new Error('不支持的圖表數據文件格式')
  }

  if (rawRows.length === 0) throw new Error('圖表數據文件爲空或格式不符合要求')
  const normalized = normalizeChartRows(rawRows)
  if (normalized.labelCount === 0) throw new Error('圖表數據需要至少一列 X 軸標籤')
  if (normalized.seriesCount === 0 || normalized.numericCellCount === 0) {
    throw new Error('圖表數據需要至少一列可識別的數值列')
  }
  if (normalized.rows.length === 0) throw new Error('沒有解析到可用的圖表數據')
  return {
    canceled: false,
    filePath,
    dataJson: JSON.stringify(normalized.rows, null, 2),
    rowCount: normalized.rows.length,
    seriesCount: normalized.seriesCount
  }
}

export function registerChartDataImportHandlers(ctx: IpcContext): void {
  ipcMain.handle('chart-data:choose-and-parse', async (): Promise<ParsedChartDataResult> => {
    const result = await dialog.showOpenDialog(ctx.mainWindow, {
      title: '選擇圖表數據',
      properties: ['openFile'],
      filters: [
        { name: 'Chart Data', extensions: ['csv', 'tsv', 'txt', 'json', 'xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return { canceled: true }
    return parseChartDataFile(result.filePaths[0])
  })
}
