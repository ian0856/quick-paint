import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, onScopeDispose, shallowRef } from 'vue'
import defaultWorkbookUrl from '../assets/example/test.xlsx?url'
import {
  applySourceTableChanges,
  colorsForScheme,
  xAxisFieldUnavailableReason,
  createDefaultChartSettings,
  defaultYAxisFieldIds,
  deleteSourceTableRows,
  downloadChart,
  exportChartImage,
  inferUniqueMapping,
  insertSourceTableRow,
  LIMITS,
  MAX_AXIS_NAME_LENGTH,
  MAX_AXIS_UNIT_LENGTH,
  MAX_CHART_FONT_SIZE,
  MAX_CHART_TITLE_LENGTH,
  MAX_MAX_BAR_THICKNESS,
  MIN_CHART_FONT_SIZE,
  MIN_MAX_BAR_THICKNESS,
  normalizeHexColor,
  parseFile,
  firstAvailableSeriesColor,
  recognizeColorScheme,
  resolveChart,
  validateSourceTable,
  yAxisSpan,
  type SeriesColorSchemeId,
  type ChartModel,
  type ChartSettings,
  yAxisFieldUnavailableReason,
  type DataSourceInterpretation,
  type FieldId,
  type ParseFailure,
  type ParseTask,
  type SourceTableChange,
  type YAxisFieldSelection,
  type ViewMode,
  type WorksheetInterpretation,
} from '../views/workbench/utils'

type WorksheetMapping = {
  xAxisFieldId: FieldId | null
  yAxisFields: YAxisFieldSelection[]
  fieldColors: Map<FieldId, string>
  chartSettings: ChartSettings
}

export const useWorkbenchStore = defineStore('workbench', () => {
  const dataSource = shallowRef<DataSourceInterpretation | null>(null)
  const selectedWorksheetId = shallowRef<string | null>(null)
  const xAxisFieldId = shallowRef<FieldId | null>(null)
  const yAxisFields = shallowRef<YAxisFieldSelection[]>([])
  const chartSettings = shallowRef<ChartSettings>(createDefaultChartSettings())
  const viewMode = shallowRef<ViewMode>('chart')
  const isParsing = shallowRef(false)
  const parseFailure = shallowRef<ParseFailure | null>(null)
  const replacementFailure = shallowRef<ParseFailure | null>(null)
  const isExporting = shallowRef(false)
  const exportError = shallowRef<string | null>(null)
  const exportSuccess = shallowRef(false)
  const worksheetEdits = shallowRef<Map<string, WorksheetInterpretation>>(new Map())
  let activeTask: ParseTask | null = null
  let defaultLoadController: AbortController | null = null
  let worksheetMappings = new Map<string, WorksheetMapping>()
  let lastValidCharts = new Map<string, ChartModel>()
  let fieldColors = new Map<FieldId, string>()

  const worksheets = computed(() => dataSource.value?.worksheets ?? [])
  const selectedWorksheet = computed(() => {
    const worksheet = worksheets.value.find(
      item => item.id === selectedWorksheetId.value && item.valid,
    )
    return worksheet ? worksheetEdits.value.get(worksheet.id) ?? worksheet : null
  })
  const hasTableEdits = computed(() =>
    selectedWorksheetId.value !== null && worksheetEdits.value.has(selectedWorksheetId.value),
  )
  const sourceTableValidation = computed(() => {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return { valid: true, message: null, cellErrors: [] }
    return validateSourceTable(
      worksheet,
      xAxisFieldId.value,
      yAxisFields.value.map(field => field.fieldId),
    )
  })
  const hasInvalidTableEdits = computed(() => hasTableEdits.value && !sourceTableValidation.value.valid)
  const chartResolution = computed(() => {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return null
    return resolveChart(
      worksheet,
      xAxisFieldId.value,
      yAxisFields.value,
      chartSettings.value,
    )
  })
  const chart = computed(() => {
    const resolution = chartResolution.value
    if (resolution?.valid) return resolution.chart
    if (!hasInvalidTableEdits.value || !selectedWorksheetId.value) return null
    return lastValidCharts.get(selectedWorksheetId.value) ?? null
  })
  const controlsDisabled = computed(() => isParsing.value || !selectedWorksheet.value)
  const chartSettingsDisabled = computed(() =>
    isParsing.value || chartResolution.value?.valid !== true,
  )
  const activeColorScheme = computed(() => recognizeColorScheme(yAxisFields.value))
  const currentYAxisSpan = computed(() => {
    const resolution = chartResolution.value
    return resolution?.valid ? yAxisSpan(resolution.chart.series) : 0
  })
  const exportDisabled = computed(() =>
    isParsing.value || isExporting.value || chartResolution.value?.valid !== true,
  )

  async function importFile(file: File) {
    defaultLoadController?.abort()
    defaultLoadController = null
    activeTask?.cancel()
    const task = parseFile(file)
    activeTask = task
    isParsing.value = true
    parseFailure.value = null
    replacementFailure.value = null
    exportError.value = null
    exportSuccess.value = false
    try {
      const result = await task.promise
      if (activeTask !== task) return
      dataSource.value = result
      worksheetMappings = new Map()
      worksheetEdits.value = new Map()
      lastValidCharts = new Map()
      const firstValid = result.worksheets.find((worksheet) => worksheet.valid) ?? null
      selectWorksheet(firstValid?.id ?? null)
    }
    catch (error) {
      if (activeTask !== task) return
      const failure = error as ParseFailure
      if (dataSource.value) replacementFailure.value = failure
      else parseFailure.value = failure
    }
    finally {
      if (activeTask === task) {
        isParsing.value = false
        activeTask = null
      }
    }
  }

  async function loadDefaultWorkbook() {
    const controller = new AbortController()
    defaultLoadController = controller
    try {
      const response = await fetch(defaultWorkbookUrl, { signal: controller.signal })
      if (!response.ok) throw new Error(`Failed to load default workbook: ${response.status}`)
      const workbook = await response.blob()
      if (controller.signal.aborted) return
      defaultLoadController = null
      await importFile(new File([workbook], 'test.xlsx', {
        type: workbook.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
    }
    catch (error) {
      if (controller.signal.aborted) return
      parseFailure.value = {
        code: 'corrupt-file',
        message: '默认示例表格加载失败。',
        recovery: '请手动导入 .xlsx 或 .csv 文件。',
      }
    }
    finally {
      if (defaultLoadController === controller) defaultLoadController = null
    }
  }

  function selectWorksheet(id: string | null) {
    selectedWorksheetId.value = id
    const worksheet = worksheets.value.find((item) => item.id === id && item.valid)
    if (!worksheet) {
      xAxisFieldId.value = null
      yAxisFields.value = []
      chartSettings.value = createDefaultChartSettings()
      fieldColors = new Map()
      return
    }
    const savedMapping = worksheetMappings.get(worksheet.id)
    if (savedMapping) {
      xAxisFieldId.value = savedMapping.xAxisFieldId
      yAxisFields.value = savedMapping.yAxisFields.map((field) => ({ ...field }))
      fieldColors = new Map(savedMapping.fieldColors)
      chartSettings.value = { ...savedMapping.chartSettings }
    }
    else {
      const mapping = inferUniqueMapping(worksheet)
      chartSettings.value = { ...createDefaultChartSettings(), title: worksheet.name }
      fieldColors = new Map()
      xAxisFieldId.value = mapping.xAxisFieldId
      yAxisFields.value = mapping.yAxisFieldIds.map((fieldId, index) => ({
        fieldId,
        color: colorsForScheme(chartSettings.value.baseColorSchemeId)[index]!,
      }))
      for (const field of yAxisFields.value) fieldColors.set(field.fieldId, field.color)
      saveWorksheetMapping()
    }
    viewMode.value = 'chart'
    exportError.value = null
    exportSuccess.value = false
    rememberValidChart()
  }

  async function exportChart() {
    const resolution = chartResolution.value
    if (!resolution?.valid || isExporting.value) return
    isExporting.value = true
    exportError.value = null
    exportSuccess.value = false
    try {
      const output = await exportChartImage(resolution.chart)
      downloadChart(output)
      exportSuccess.value = true
      window.setTimeout(() => { exportSuccess.value = false }, 2400)
    }
    catch (error) {
      exportError.value = error instanceof Error ? error.message : '导出失败，请重试。'
    }
    finally {
      isExporting.value = false
    }
  }

  function dismissReplacementFailure() {
    replacementFailure.value = null
  }

  function selectXAxisField(id: FieldId | null) {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return
    if (id !== null) {
      const field = worksheet.fields.find((item) => item.id === id)
      if (!field || xAxisFieldUnavailableReason(field, [])) return
    }

    xAxisFieldId.value = id
    const next: YAxisFieldSelection[] = []
    for (const fieldId of defaultYAxisFieldIds(worksheet, id)) {
      const color = fieldColors.get(fieldId)
        ?? firstAvailableSeriesColor(chartSettings.value.baseColorSchemeId, next)
      next.push({ fieldId, color })
      fieldColors.set(fieldId, color)
    }
    yAxisFields.value = next
    finishChartChange()
  }

  function selectYAxisFields(ids: FieldId[]) {
    const worksheet = selectedWorksheet.value
    if (!worksheet || xAxisFieldId.value === null) return

    const requestedIds = [...new Set(ids)].filter((id) => {
      const field = worksheet.fields.find((item) => item.id === id)
      return field && !yAxisFieldUnavailableReason(field, xAxisFieldId.value)
    })
    const requested = new Set(requestedIds)
    const retained = yAxisFields.value.filter((field) => requested.has(field.fieldId))
    const retainedIds = new Set(retained.map((field) => field.fieldId))
    const next = retained.slice()

    for (const fieldId of requestedIds) {
      if (next.length >= LIMITS.chartYAxisFields) break
      if (retainedIds.has(fieldId)) continue
      const color = fieldColors.get(fieldId)
        ?? firstAvailableSeriesColor(chartSettings.value.baseColorSchemeId, next)
      next.push({ fieldId, color })
      fieldColors.set(fieldId, color)
    }

    yAxisFields.value = next
    finishChartChange()
  }

  function reorderYAxisFields(ids: FieldId[]) {
    if (ids.length !== yAxisFields.value.length) return
    const byId = new Map(yAxisFields.value.map((field) => [field.fieldId, field]))
    if (new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) return
    yAxisFields.value = ids.map((id) => byId.get(id)!)
    finishChartChange()
  }

  function updateTitle(nextTitle: string) {
    if (nextTitle.length > MAX_CHART_TITLE_LENGTH) return
    chartSettings.value = { ...chartSettings.value, title: nextTitle }
    finishChartChange()
  }

  function updateChartType(chartType: ChartSettings['chartType']) {
    chartSettings.value = { ...chartSettings.value, chartType }
    finishChartChange()
  }

  function updateLineStyle(lineStyle: ChartSettings['lineStyle']) {
    chartSettings.value = { ...chartSettings.value, lineStyle }
    finishChartChange()
  }

  function updateShowLineArea(showLineArea: boolean) {
    chartSettings.value = { ...chartSettings.value, showLineArea }
    finishChartChange()
  }

  function updateShowDetails(showDetails: boolean) {
    chartSettings.value = { ...chartSettings.value, showDetails }
    finishChartChange()
  }

  function updateDetailLabelFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, detailLabelFontSize: value }
    finishChartChange()
  }

  function updateDetailLabelColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, detailLabelColor: color }
    finishChartChange()
  }

  function updateTitleFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, titleFontSize: value }
    finishChartChange()
  }

  function updateTitleColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, titleColor: color }
    finishChartChange()
  }

  function selectSeriesColorScheme(id: SeriesColorSchemeId) {
    const colors = colorsForScheme(id)
    yAxisFields.value = yAxisFields.value.map((field, index) => ({
      fieldId: field.fieldId,
      color: colors[index]!,
    }))
    fieldColors = new Map(yAxisFields.value.map(field => [field.fieldId, field.color]))
    chartSettings.value = { ...chartSettings.value, baseColorSchemeId: id }
    finishChartChange()
  }

  function updateValueSeriesColor(fieldId: FieldId, nextColor: string) {
    const color = normalizeHexColor(nextColor)
    if (!color || !yAxisFields.value.some(field => field.fieldId === fieldId)) return
    yAxisFields.value = yAxisFields.value.map(field =>
      field.fieldId === fieldId ? { ...field, color } : field,
    )
    fieldColors.set(fieldId, color)
    finishChartChange()
  }

  function updateMaxBarThickness(value: number) {
    if (!Number.isInteger(value) || value < MIN_MAX_BAR_THICKNESS || value > MAX_MAX_BAR_THICKNESS) return
    chartSettings.value = { ...chartSettings.value, maxBarThickness: value }
    finishChartChange()
  }

  function updateXAxisName(value: string) {
    if (value.length > MAX_AXIS_NAME_LENGTH) return
    chartSettings.value = { ...chartSettings.value, xAxisName: value }
    finishChartChange()
  }

  function updateYAxisName(value: string) {
    if (value.length > MAX_AXIS_NAME_LENGTH) return
    chartSettings.value = { ...chartSettings.value, yAxisName: value }
    finishChartChange()
  }

  function updateXAxisNameFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, xAxisNameFontSize: value }
    finishChartChange()
  }

  function updateYAxisNameFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, yAxisNameFontSize: value }
    finishChartChange()
  }

  function updateXAxisNameColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, xAxisNameColor: color }
    finishChartChange()
  }

  function updateYAxisNameColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, yAxisNameColor: color }
    finishChartChange()
  }

  function updateYAxisUnit(value: string) {
    if (value.length > MAX_AXIS_UNIT_LENGTH) return
    chartSettings.value = { ...chartSettings.value, yAxisUnit: value }
    finishChartChange()
  }

  function updateChartLabelFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, chartLabelFontSize: value }
    finishChartChange()
  }

  function updateXAxisTickLabelFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, xAxisTickLabelFontSize: value }
    finishChartChange()
  }

  function updateYAxisTickLabelFontSize(value: number) {
    if (!isValidChartFontSize(value)) return
    chartSettings.value = { ...chartSettings.value, yAxisTickLabelFontSize: value }
    finishChartChange()
  }

  function updateXAxisTickLabelColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, xAxisTickLabelColor: color }
    finishChartChange()
  }

  function updateYAxisTickLabelColor(value: string) {
    const color = normalizeHexColor(value)
    if (!color) return
    chartSettings.value = { ...chartSettings.value, yAxisTickLabelColor: color }
    finishChartChange()
  }

  function updateYAxisTickIntervalMode(mode: ChartSettings['yAxisTickIntervalMode']) {
    chartSettings.value = { ...chartSettings.value, yAxisTickIntervalMode: mode }
    finishChartChange()
  }

  function updateFixedYAxisTickInterval(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    chartSettings.value = { ...chartSettings.value, fixedYAxisTickInterval: value }
    finishChartChange()
  }

  function updateSourceTable(changes: readonly SourceTableChange[]) {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return
    saveWorksheetEdit(applySourceTableChanges(worksheet, changes))
  }

  function insertSourceTableRecord() {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return
    saveWorksheetEdit(insertSourceTableRow(worksheet))
  }

  function deleteSourceTableRecords(rowIndexes: readonly number[]) {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return
    const updated = deleteSourceTableRows(worksheet, rowIndexes)
    if (updated !== worksheet) saveWorksheetEdit(updated)
  }

  function changeView(mode: ViewMode) {
    if (controlsDisabled.value) return
    viewMode.value = mode
  }

  function saveWorksheetMapping() {
    if (!selectedWorksheetId.value) return
    worksheetMappings.set(selectedWorksheetId.value, {
      xAxisFieldId: xAxisFieldId.value,
      yAxisFields: yAxisFields.value.map((field) => ({ ...field })),
      fieldColors: new Map(fieldColors),
      chartSettings: { ...chartSettings.value },
    })
  }

  function finishChartChange() {
    saveWorksheetMapping()
    exportError.value = null
    exportSuccess.value = false
    rememberValidChart()
  }

  function saveWorksheetEdit(worksheet: WorksheetInterpretation) {
    const edits = new Map(worksheetEdits.value)
    edits.set(worksheet.id, worksheet)
    worksheetEdits.value = edits
    exportError.value = null
    exportSuccess.value = false
    rememberValidChart()
  }

  function rememberValidChart() {
    const worksheetId = selectedWorksheetId.value
    const resolution = chartResolution.value
    if (worksheetId && resolution?.valid) lastValidCharts.set(worksheetId, resolution.chart)
  }

  void loadDefaultWorkbook()

  onScopeDispose(() => {
    defaultLoadController?.abort()
    activeTask?.cancel()
  })

  return {
    dataSource,
    worksheets,
    selectedWorksheet,
    selectedWorksheetId,
    xAxisFieldId,
    yAxisFields,
    chartSettings,
    viewMode,
    isParsing,
    parseFailure,
    replacementFailure,
    isExporting,
    exportError,
    exportSuccess,
    chartResolution,
    chart,
    sourceTableValidation,
    hasInvalidTableEdits,
    controlsDisabled,
    chartSettingsDisabled,
    activeColorScheme,
    currentYAxisSpan,
    exportDisabled,
    importFile,
    selectWorksheet,
    exportChart,
    dismissReplacementFailure,
    selectXAxisField,
    selectYAxisFields,
    reorderYAxisFields,
    updateChartType,
    updateLineStyle,
    updateShowLineArea,
    updateShowDetails,
    updateDetailLabelFontSize,
    updateDetailLabelColor,
    updateTitle,
    updateTitleFontSize,
    updateTitleColor,
    selectSeriesColorScheme,
    updateValueSeriesColor,
    updateMaxBarThickness,
    updateXAxisName,
    updateYAxisName,
    updateXAxisNameFontSize,
    updateYAxisNameFontSize,
    updateXAxisNameColor,
    updateYAxisNameColor,
    updateYAxisUnit,
    updateChartLabelFontSize,
    updateXAxisTickLabelFontSize,
    updateYAxisTickLabelFontSize,
    updateXAxisTickLabelColor,
    updateYAxisTickLabelColor,
    updateYAxisTickIntervalMode,
    updateFixedYAxisTickInterval,
    updateSourceTable,
    insertSourceTableRecord,
    deleteSourceTableRecords,
    changeView,
  }
})

function isValidChartFontSize(value: number) {
  return Number.isInteger(value)
    && value >= MIN_CHART_FONT_SIZE
    && value <= MAX_CHART_FONT_SIZE
}

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWorkbenchStore, import.meta.hot))
