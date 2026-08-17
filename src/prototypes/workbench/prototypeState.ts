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
  { value: 'month', label: '月份', kind: '文本' },
  { value: 'east', label: '华东', kind: '数字' },
  { value: 'south', label: '华南', kind: '数字' },
  { value: 'west', label: '华西', kind: '数字' },
  { value: 'north', label: '华北', kind: '数字' },
]

export const compositionState = reactive({
  dataSource: '2026 上半年区域销售.xlsx',
  worksheet: '区域销售',
  chartType: 'bar' as ChartType,
  categoryField: 'month',
  valueField: 'east',
  title: '2026 上半年区域销售',
  color: '#2f6fed',
  showLegend: true,
  width: 1600,
  height: 900,
})

export const selectedFieldLabel = computed(
  () => fields.find((field) => field.value === compositionState.valueField)?.label ?? '',
)

export function acceptPrototypeFile(file: File) {
  compositionState.dataSource = file.name
  return false
}
