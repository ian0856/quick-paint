<script setup lang="ts">
import { init } from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import ZoomPanCanvas from '../../../components/ZoomPanCanvas.vue'
import { createChartOption, type ChartModel } from '../utils'

const props = defineProps<{
  chart: ChartModel
  resetRevision: number
}>()
const zoomPanCanvas = useTemplateRef<InstanceType<typeof ZoomPanCanvas>>('zoomPanCanvas')
const chartHost = useTemplateRef<HTMLDivElement>('chartHost')
let chartInstance: ECharts | null = null
let resizeObserver: ResizeObserver | null = null
const chartTypeLabel = computed(() => props.chart.settings.chartType === 'bar' ? '柱状图' : '折线图')

function updateChart(chartWidth = chartHost.value?.clientWidth) {
  chartInstance?.setOption(createChartOption(props.chart, { chartWidth }), { notMerge: true, lazyUpdate: false })
}

onMounted(() => {
  if (!chartHost.value) return
  chartInstance = init(chartHost.value, undefined, { renderer: 'canvas' })
  updateChart()
  resizeObserver = new ResizeObserver(([entry]) => {
    chartInstance?.resize({ animation: { duration: 0 } })
    updateChart(entry?.contentRect.width)
  })
  resizeObserver.observe(chartHost.value)
})
watch(() => props.chart, () => updateChart())
watch(() => props.resetRevision, () => zoomPanCanvas.value?.reset())
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  const instance = chartInstance
  chartInstance = null
  instance?.dispose()
})
</script>

<template>
  <section class="h-full min-h-0 min-w-0 w-full grid grid-rows-[32px_minmax(0,1fr)] px-7.5 pb-7.5 pt-6" :aria-label="`${chartTypeLabel}预览`">
    <div class="text-right text-caption">共 {{ chart.labels.length }} 条数据</div>
    <ZoomPanCanvas ref="zoomPanCanvas" aria-label="图表缩放画布">
      <div class="chart-panel relative h-full min-h-0 min-w-0 border border-base rounded-1.5 bg-base px-7 pb-4.5 pt-6 shadow-[0_8px_22px_rgb(30_42_64/5%)]">
        <div
          ref="chartHost"
          class="h-full min-h-0 min-w-0 w-full"
          role="img"
          :aria-label="`${chartTypeLabel}：${chart.title}，共 ${chart.labels.length} 条数据，${chart.series.length} 个数值系列`"
        />
        <table class="sr-only" :aria-label="`${chartTypeLabel}数据`">
          <thead>
            <tr>
              <th scope="col">x轴字段</th>
              <th v-for="series in chart.series" :key="series.fieldId" scope="col">{{ series.fieldName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, rowIndex) in chart.labels" :key="rowIndex">
              <th scope="row">{{ label }}</th>
              <td v-for="series in chart.series" :key="series.fieldId">
                {{ series.values[rowIndex] ?? '（空白）' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ZoomPanCanvas>
  </section>
</template>
