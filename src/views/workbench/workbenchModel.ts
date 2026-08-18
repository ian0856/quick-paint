export type ChartType = 'bar' | 'line' | 'pie' | 'scatter'

export type WorkbenchComposition = {
  chartType: ChartType
  categoryField: string
  seriesFields: string[]
  title: string
  selectedColor: string
  showLegend: boolean
  showDataLabels: boolean
  width: number
  height: number
}

export const defaultComposition: WorkbenchComposition = {
  chartType: 'bar',
  categoryField: 'month',
  seriesFields: ['east', 'south'],
  title: '2026 上半年区域销售',
  selectedColor: '#2f6fed',
  showLegend: true,
  showDataLabels: false,
  width: 1600,
  height: 900,
}
