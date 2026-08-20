import * as XLSX from 'xlsx'
import type { CellObject, WorkBook, WorkSheet } from 'xlsx'
import type {
  DataSourceInterpretation,
  ParseFailure,
  SourceCell,
  SourceField,
  WorksheetInterpretation,
} from './model'
import { LIMITS } from './model'
import { numericCellValue } from './chartModel'

const SUPPORTED_EXTENSIONS = new Set(['xlsx', 'csv'])

export class DataSourceParseError extends Error {
  readonly failure: ParseFailure

  constructor(failure: ParseFailure) {
    super(failure.message)
    this.name = 'DataSourceParseError'
    this.failure = failure
  }
}

export function parseDataSource(
  data: ArrayBuffer,
  fileName: string,
  fileSize: number,
): DataSourceInterpretation {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw failure('unsupported-file', '仅支持 .xlsx 和 UTF-8 .csv 文件。', '请选择受支持的文件。')
  }
  if (fileSize > LIMITS.fileBytes) {
    throw failure('file-too-large', '文件超过 20 MiB 上限。', '请选择更小的文件。')
  }

  let workbook: WorkBook
  try {
    if (extension === 'csv') {
      const text = decodeCsv(data)
      validateCsvDelimiter(text)
      workbook = XLSX.read(text, { type: 'string', raw: true, dense: false })
    }
    else {
      const signature = new Uint8Array(data, 0, Math.min(4, data.byteLength))
      if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
        throw failure('corrupt-file', '文件内容不是有效的 .xlsx 工作簿。', '请重新导出文件后再试。')
      }
      workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        cellFormula: true,
        cellNF: true,
        dense: false,
      })
    }
  }
  catch (error) {
    if (error instanceof DataSourceParseError) throw error
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (message.includes('password') || message.includes('encrypt')) {
      throw failure('password-protected', '无法读取受密码保护的工作簿。', '请另存为未加密的 .xlsx 文件。')
    }
    throw failure('corrupt-file', '文件损坏或无法识别。', '请检查文件后重新导入。')
  }

  return interpretWorkbook(workbook, fileName, fileSize, extension === 'csv')
}

export function interpretWorkbook(
  workbook: WorkBook,
  fileName: string,
  fileSize: number,
  fromCsv = false,
): DataSourceInterpretation {
  const visibleNames = workbook.SheetNames.filter((_, index) => {
    const metadata = workbook.Workbook?.Sheets?.[index]
    return !metadata?.Hidden
  })
  if (visibleNames.length > LIMITS.visibleWorksheets) {
    throw failure(
      'too-many-worksheets',
      `文件包含超过 ${LIMITS.visibleWorksheets} 个可见工作表。`,
      '请删除不需要的工作表后再试。',
    )
  }

  const worksheets = visibleNames.map((name, index) =>
    interpretWorksheet(workbook.Sheets[name]!, name, index, fromCsv),
  )
  if (!worksheets.some((worksheet) => worksheet.valid)) {
    throw failure('no-valid-worksheet', '文件中没有可用的连续表格。', '请检查表头和表格结构后再试。')
  }
  return { fileName, fileSize, worksheets }
}

function interpretWorksheet(
  sheet: WorkSheet,
  name: string,
  index: number,
  fromCsv: boolean,
): WorksheetInterpretation {
  const invalid = (message: string): WorksheetInterpretation => ({
    id: `${index}:${name}`,
    name,
    valid: false,
    fields: [],
    recordCount: 0,
    warnings: [],
    error: message,
  })

  if ((sheet['!merges']?.length ?? 0) > 0) return invalid('包含合并单元格。')
  const bounds = actualBounds(sheet)
  if (!bounds) return invalid('没有可识别的数据。')

  const fieldCount = bounds.maxColumn - bounds.minColumn + 1
  const recordCount = bounds.maxRow - bounds.minRow
  if (fieldCount > LIMITS.worksheetFields) return invalid(`超过 ${LIMITS.worksheetFields} 个字段上限。`)
  if (recordCount > LIMITS.worksheetRecords) return invalid(`超过 ${LIMITS.worksheetRecords} 条数据上限。`)
  if (fieldCount * (recordCount + 1) > LIMITS.worksheetCells) {
    return invalid(`超过 ${LIMITS.worksheetCells.toLocaleString('zh-CN')} 个单元格上限。`)
  }
  if (recordCount < 1) return invalid('表头下方没有数据。')

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })]
      if (typeof cell?.v === 'string' && cell.v.length > LIMITS.sourceValueCharacters) {
        return invalid(`${XLSX.utils.encode_cell({ r: row, c: column })} 超过单元格字符上限。`)
      }
    }
  }

  for (let row = bounds.minRow + 1; row <= bounds.maxRow; row += 1) {
    const hasValue = rangeSome(bounds.minColumn, bounds.maxColumn, (column) =>
      hasStructuralValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]),
    )
    if (!hasValue) return invalid(`第 ${row + 1} 行是完整空行。`)
  }
  for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
    const hasValue = rangeSome(bounds.minRow, bounds.maxRow, (row) =>
      hasStructuralValue(sheet[XLSX.utils.encode_cell({ r: row, c: column })]),
    )
    if (!hasValue) return invalid(`${XLSX.utils.encode_col(column)} 列是完整空列。`)
  }

  const fields = Array.from({ length: fieldCount }, (_, offset) => {
    const column = bounds.minColumn + offset
    return createField(sheet, bounds.minRow, bounds.maxRow, column, offset, fromCsv)
  })
  applyDistinctLabels(fields)
  const warnings = []
  if (fields.some((field) => field.values.some((cell) => cell.formula))) {
    warnings.push({ code: 'formula-results', message: '工作表包含公式，当前显示文件中已保存的结果。' })
  }
  if (sheet['!rows']?.some((row) => row?.hidden) || sheet['!cols']?.some((column) => column?.hidden)) {
    warnings.push({ code: 'hidden-cells', message: '隐藏行列仍包含在当前数据中。' })
  }

  return {
    id: `${index}:${name}`,
    name,
    valid: true,
    fields,
    recordCount,
    warnings,
    error: null,
  }
}

function createField(
  sheet: WorkSheet,
  headerRow: number,
  maxRow: number,
  column: number,
  id: number,
  fromCsv: boolean,
): SourceField {
  const sourceColumn = XLSX.utils.encode_col(column)
  const header = sheet[XLSX.utils.encode_cell({ r: headerRow, c: column })]
  const rawName = displayCell(header).trim()
  const name = rawName || `未命名列 ${sourceColumn}`
  const values = Array.from({ length: maxRow - headerRow }, (_, rowOffset) => {
    const row = headerRow + rowOffset + 1
    return sourceCell(sheet[XLSX.utils.encode_cell({ r: row, c: column })], fromCsv)
  })
  const meaningfulKinds = new Set(values.filter((cell) => !['missing', 'error'].includes(cell.kind)).map((cell) => cell.kind))
  const kind = meaningfulKinds.size === 1
    ? ([...meaningfulKinds][0] as SourceField['kind'])
    : 'mixed'
  const errorCount = values.filter((cell) => cell.kind === 'error').length
  const numericRoleEligible = errorCount === 0 &&
    values.some((cell) => numericCellValue(cell) !== null) &&
    values.every((cell) => cell.kind === 'missing' || numericCellValue(cell) !== null)

  return {
    id,
    sourceColumn,
    name,
    label: name,
    kind,
    profile: {
      missingCount: values.filter((cell) => cell.kind === 'missing').length,
      errorCount,
      numericRoleEligible,
    },
    values,
  }
}

function sourceCell(cell: CellObject | undefined, fromCsv: boolean): SourceCell {
  const formula = typeof cell?.f === 'string'
  if (!cell || cell.v === undefined || cell.v === null || (cell.t === 's' && !String(cell.v).trim())) {
    return { kind: formula ? 'error' : 'missing', value: null, display: '', formula }
  }
  if (cell.t === 'e') return { kind: 'error', value: null, display: '#ERROR', formula }
  if (cell.v instanceof Date || cell.t === 'd') {
    const date = cell.v instanceof Date ? cell.v : new Date(String(cell.v))
    return { kind: 'date', value: date.toISOString(), display: displayCell(cell), formula }
  }
  if (cell.t === 'n' && typeof cell.v === 'number' && !fromCsv) {
    return { kind: 'number', value: cell.v, display: displayCell(cell), formula }
  }
  if (cell.t === 'b') {
    return { kind: 'boolean', value: Boolean(cell.v), display: cell.v ? '是' : '否', formula }
  }
  const value = String(cell.v)
  return {
    kind: 'text',
    value,
    display: value,
    formula,
  }
}

function actualBounds(sheet: WorkSheet) {
  let minRow = Number.POSITIVE_INFINITY
  let maxRow = -1
  let minColumn = Number.POSITIVE_INFINITY
  let maxColumn = -1
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!') || !hasStructuralValue(sheet[key])) continue
    const coordinate = XLSX.utils.decode_cell(key)
    minRow = Math.min(minRow, coordinate.r)
    maxRow = Math.max(maxRow, coordinate.r)
    minColumn = Math.min(minColumn, coordinate.c)
    maxColumn = Math.max(maxColumn, coordinate.c)
  }
  if (maxRow < 0 || maxColumn < 0) return null
  return { minRow, maxRow, minColumn, maxColumn }
}

function hasStructuralValue(cell: CellObject | undefined) {
  if (!cell) return false
  if (typeof cell.f === 'string') return true
  if (cell.v === undefined || cell.v === null) return false
  return typeof cell.v !== 'string' || cell.v.trim().length > 0
}

function displayCell(cell: CellObject | undefined) {
  if (!cell || cell.v === undefined || cell.v === null) return ''
  return XLSX.utils.format_cell(cell)
}

function applyDistinctLabels(fields: SourceField[]) {
  const counts = new Map<string, number>()
  fields.forEach((field) => counts.set(field.name, (counts.get(field.name) ?? 0) + 1))
  fields.forEach((field) => {
    field.label = (counts.get(field.name) ?? 0) > 1
      ? `${field.name}（${field.sourceColumn} 列）`
      : field.name
  })
}

function rangeSome(start: number, end: number, predicate: (value: number) => boolean) {
  for (let value = start; value <= end; value += 1) {
    if (predicate(value)) return true
  }
  return false
}

function decodeCsv(data: ArrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data)
  }
  catch {
    throw failure('csv-encoding', 'CSV 不是有效的 UTF-8 编码。', '请将文件另存为 UTF-8 CSV。')
  }
}

function validateCsvDelimiter(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim()).slice(0, 20)
  const candidates = [',', ';', '\t'].map((delimiter) => ({
    delimiter,
    counts: lines.map((line) => line.split(delimiter).length - 1),
  })).filter((candidate) => candidate.counts.some((count) => count > 0))
  if (candidates.length < 2) return
  const consistent = candidates.filter((candidate) => new Set(candidate.counts).size === 1)
  if (consistent.length > 1) {
    throw failure('csv-delimiter', 'CSV 分隔符不明确。', '请使用一致的逗号、分号或 Tab 分隔。')
  }
}

function failure(code: ParseFailure['code'], message: string, recovery: string) {
  return new DataSourceParseError({ code, message, recovery })
}
