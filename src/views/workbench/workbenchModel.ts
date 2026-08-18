import type { ChartType, FieldId } from './chartComposition'

export type WorkbenchComposition = {
  chartType: ChartType | null
  categoryFieldId: FieldId | null
  valueFieldId: FieldId | null
  title: string
  selectedColor: string
  showLegend: boolean
  showDataLabels: boolean
  width: number
  height: number
}

export const defaultComposition: WorkbenchComposition = {
  chartType: null,
  categoryFieldId: null,
  valueFieldId: null,
  title: '2026 上半年区域销售',
  selectedColor: '#2f6fed',
  showLegend: true,
  showDataLabels: false,
  width: 1600,
  height: 900,
}

export type { ChartType }
