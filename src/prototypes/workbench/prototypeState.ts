import { computed, reactive } from 'vue'

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter'

export const chartTypes: Array<{ value: ChartType; label: string }> = [
  { value: 'bar', label: '柱状图' },
  { value: 'line', label: '折线图' },
  { value: 'pie', label: '饼图' },
  { value: 'scatter', label: '散点图' },
]

export const worksheetRows = [
  { month: '一月', east: 86, south: 62, west: 48, north: 71 },
  { month: '二月', east: 104, south: 75, west: 56, north: 68 },
  { month: '三月', east: 98, south: 81, west: 64, north: 77 },
  { month: '四月', east: 126, south: 90, west: 72, north: 85 },
  { month: '五月', east: 142, south: 96, west: 80, north: 91 },
  { month: '六月', east: 158, south: 112, west: 88, north: 103 },
]

export const fields = [
  { value: 'month', label: '月份', kind: '文本', detail: '6 个文本 · 无缺失', numeric: false },
  { value: 'east', label: '华东', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'south', label: '华南', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'west', label: '华西', kind: '数字', detail: '5 个数字 · 1 个缺失', numeric: true },
  { value: 'north', label: '华北', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'reportedAt', label: '填报日期', kind: '日期', detail: '6 个日期 · 不能用于数值角色', numeric: false },
  { value: 'note', label: '备注', kind: '混合', detail: '含文本 · 不能用于数值角色', numeric: false },
]

export const compositionState = reactive({
  dataSource: '2026 上半年区域销售.xlsx',
  worksheet: '区域销售',
  chartType: 'bar' as ChartType,
  categoryField: 'month',
  valueField: 'east',
  seriesFields: ['east', 'south'] as string[],
  title: '2026 上半年区域销售',
  color: '#2f6fed',
  palette: ['#2f6fed', '#22a06b', '#f0a128'],
  showLegend: true,
  showDataLabels: false,
  width: 1600,
  height: 900,
})

export const selectedFieldLabel = computed(
  () => fields.find((field) => field.value === compositionState.valueField)?.label ?? '',
)

export const numericFields = computed(() => fields.filter((field) => field.numeric))

export const mappingRoles = computed(() => {
  if (compositionState.chartType === 'pie') return { primary: '名称', series: '数值', multiple: false }
  if (compositionState.chartType === 'scatter') return { primary: 'X 轴', series: 'Y 轴', multiple: true }
  return { primary: '类别', series: '数值系列', multiple: true }
})

export const seriesSelection = computed<string | string[]>({
  get: () => mappingRoles.value.multiple ? compositionState.seriesFields : (compositionState.seriesFields[0] || ''),
  set: (value) => {
    compositionState.seriesFields = Array.isArray(value) ? value : (value ? [value] : [])
  },
})

export const mappingWarning = computed(() => {
  if (compositionState.seriesFields.includes('west')) return '“华西”有 1 个缺失值；对应图形将跳过，并保留类别位置。'
  return ''
})

export function setChartType(type: ChartType) {
  const previous = compositionState.chartType
  compositionState.chartType = type
  const preservesMapping = (previous === 'bar' || previous === 'line') && (type === 'bar' || type === 'line')
  if (!preservesMapping) {
    compositionState.categoryField = ''
    compositionState.seriesFields = []
  }
}

export function acceptPrototypeFile(file: File) {
  compositionState.dataSource = file.name
  return false
}
