import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, onScopeDispose, shallowRef } from 'vue'
import {
  categoryUnavailableReason,
  defaultValueFieldIds,
  downloadChart,
  exportBarChart,
  inferUniqueMapping,
  LIMITS,
  parseFile,
  resolveBarChart,
  SERIES_COLORS,
  valueUnavailableReason,
  type DataSourceInterpretation,
  type FieldId,
  type ParseFailure,
  type ParseTask,
  type ValueFieldSelection,
  type ViewMode,
} from '../views/workbench/utils'

type WorksheetMapping = {
  categoryFieldId: FieldId | null
  valueFields: ValueFieldSelection[]
}

export const useWorkbenchStore = defineStore('workbench', () => {
  const dataSource = shallowRef<DataSourceInterpretation | null>(null)
  const selectedWorksheetId = shallowRef<string | null>(null)
  const categoryFieldId = shallowRef<FieldId | null>(null)
  const valueFields = shallowRef<ValueFieldSelection[]>([])
  const title = shallowRef('')
  const viewMode = shallowRef<ViewMode>('chart')
  const isParsing = shallowRef(false)
  const parseFailure = shallowRef<ParseFailure | null>(null)
  const replacementFailure = shallowRef<ParseFailure | null>(null)
  const isExporting = shallowRef(false)
  const exportError = shallowRef<string | null>(null)
  const exportSuccess = shallowRef(false)
  let activeTask: ParseTask | null = null
  let worksheetMappings = new Map<string, WorksheetMapping>()

  const worksheets = computed(() => dataSource.value?.worksheets ?? [])
  const selectedWorksheet = computed(() =>
    worksheets.value.find((worksheet) => worksheet.id === selectedWorksheetId.value && worksheet.valid) ?? null,
  )
  const chartResolution = computed(() => {
    const worksheet = selectedWorksheet.value
    if (!worksheet) return null
    return resolveBarChart(worksheet, categoryFieldId.value, valueFields.value, title.value)
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
      worksheetMappings = new Map()
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
      valueFields.value = []
      title.value = ''
      return
    }
    const savedMapping = worksheetMappings.get(worksheet.id)
    if (savedMapping) {
      categoryFieldId.value = savedMapping.categoryFieldId
      valueFields.value = savedMapping.valueFields.map((field) => ({ ...field }))
    }
    else {
      const mapping = inferUniqueMapping(worksheet)
      categoryFieldId.value = mapping.categoryFieldId
      valueFields.value = mapping.valueFieldIds.map((fieldId, index) => ({
        fieldId,
        color: SERIES_COLORS[index]!,
      }))
      saveWorksheetMapping()
    }
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
    const worksheet = selectedWorksheet.value
    if (!worksheet) return
    if (id !== null) {
      const field = worksheet.fields.find((item) => item.id === id)
      if (!field || categoryUnavailableReason(field, [])) return
    }

    categoryFieldId.value = id
    valueFields.value = defaultValueFieldIds(worksheet, id).map((fieldId, index) => ({
      fieldId,
      color: SERIES_COLORS[index]!,
    }))
    finishChartChange()
  }

  function selectValueFields(ids: FieldId[]) {
    const worksheet = selectedWorksheet.value
    if (!worksheet || categoryFieldId.value === null) return

    const requestedIds = [...new Set(ids)].filter((id) => {
      const field = worksheet.fields.find((item) => item.id === id)
      return field && !valueUnavailableReason(field, categoryFieldId.value)
    })
    const requested = new Set(requestedIds)
    const retained = valueFields.value.filter((field) => requested.has(field.fieldId))
    const retainedIds = new Set(retained.map((field) => field.fieldId))
    const next = retained.slice()

    for (const fieldId of requestedIds) {
      if (next.length >= LIMITS.chartValueFields) break
      if (retainedIds.has(fieldId)) continue
      const usedColors = new Set(next.map((field) => field.color))
      const color = SERIES_COLORS.find((candidate) => !usedColors.has(candidate))
      if (color) next.push({ fieldId, color })
    }

    valueFields.value = next
    finishChartChange()
  }

  function reorderValueFields(ids: FieldId[]) {
    if (ids.length !== valueFields.value.length) return
    const byId = new Map(valueFields.value.map((field) => [field.fieldId, field]))
    if (new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) return
    valueFields.value = ids.map((id) => byId.get(id)!)
    finishChartChange()
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

  function saveWorksheetMapping() {
    if (!selectedWorksheetId.value) return
    worksheetMappings.set(selectedWorksheetId.value, {
      categoryFieldId: categoryFieldId.value,
      valueFields: valueFields.value.map((field) => ({ ...field })),
    })
  }

  function finishChartChange() {
    saveWorksheetMapping()
    exportError.value = null
    exportSuccess.value = false
  }

  onScopeDispose(() => activeTask?.cancel())

  return {
    dataSource,
    worksheets,
    selectedWorksheet,
    selectedWorksheetId,
    categoryFieldId,
    valueFields,
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
    selectValueFields,
    reorderValueFields,
    updateTitle,
    changeView,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWorkbenchStore, import.meta.hot))
