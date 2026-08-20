import { computed, onUnmounted, shallowRef } from 'vue'
import { downloadChart, exportBarChart } from './chartExporter'
import {
  inferUniqueMapping,
  parseFile,
  resolveBarChart,
  type DataSourceInterpretation,
  type FieldId,
  type ParseFailure,
  type ParseTask,
  type ViewMode,
} from './utils'

export function useWorkbench() {
  const dataSource = shallowRef<DataSourceInterpretation | null>(null)
  const selectedWorksheetId = shallowRef<string | null>(null)
  const categoryFieldId = shallowRef<FieldId | null>(null)
  const valueFieldId = shallowRef<FieldId | null>(null)
  const title = shallowRef('')
  const viewMode = shallowRef<ViewMode>('chart')
  const isParsing = shallowRef(false)
  const parseFailure = shallowRef<ParseFailure | null>(null)
  const replacementFailure = shallowRef<ParseFailure | null>(null)
  const isExporting = shallowRef(false)
  const exportError = shallowRef<string | null>(null)
  const exportSuccess = shallowRef(false)
  let activeTask: ParseTask | null = null

  const worksheets = computed(() => dataSource.value?.worksheets ?? [])
  const selectedWorksheet = computed(() =>
    worksheets.value.find((worksheet) => worksheet.id === selectedWorksheetId.value && worksheet.valid) ?? null,
  )
  const chartResolution = computed(() => {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return null
    return resolveBarChart(worksheet, categoryFieldId.value, valueFieldId.value, title.value)
  })
  const chart = computed(() => chartResolution.value?.valid ? chartResolution.value.chart : null)
  const controlsDisabled = computed(() => isParsing.value || !selectedWorksheet.value)
  const exportDisabled = computed(() => isParsing.value || isExporting.value || !chart.value)

  async function importFile(file: File) {
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

  function selectWorksheet(id: string | null) {
    selectedWorksheetId.value = id
    const worksheet = worksheets.value.find((item) => item.id === id && item.valid)
    if (!worksheet) {
      categoryFieldId.value = null
      valueFieldId.value = null
      title.value = ''
      return
    }
    const mapping = inferUniqueMapping(worksheet)
    categoryFieldId.value = mapping.categoryFieldId
    valueFieldId.value = mapping.valueFieldId
    title.value = worksheet.name
    viewMode.value = 'chart'
    exportError.value = null
    exportSuccess.value = false
  }

  async function exportChart() {
    if (!chart.value || isExporting.value) return
    isExporting.value = true
    exportError.value = null
    exportSuccess.value = false
    try {
      const output = await exportBarChart(chart.value)
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

  function selectCategoryField(id: FieldId | null) {
    categoryFieldId.value = id
    exportError.value = null
    exportSuccess.value = false
  }

  function selectValueField(id: FieldId | null) {
    valueFieldId.value = id
    exportError.value = null
    exportSuccess.value = false
  }

  function updateTitle(nextTitle: string) {
    title.value = nextTitle
    exportError.value = null
    exportSuccess.value = false
  }

  function changeView(mode: ViewMode) {
    if (controlsDisabled.value) return
    viewMode.value = mode
  }

  onUnmounted(() => activeTask?.cancel())

  return {
    dataSource,
    worksheets,
    selectedWorksheet,
    selectedWorksheetId,
    categoryFieldId,
    valueFieldId,
    title,
    viewMode,
    isParsing,
    parseFailure,
    replacementFailure,
    isExporting,
    exportError,
    exportSuccess,
    chartResolution,
    chart,
    controlsDisabled,
    exportDisabled,
    importFile,
    selectWorksheet,
    exportChart,
    dismissReplacementFailure,
    selectCategoryField,
    selectValueField,
    updateTitle,
    changeView,
  }
}
