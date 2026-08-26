<script setup lang="ts">
import { init } from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import ZoomPanCanvas from '../../../components/ZoomPanCanvas.vue'
import {
  CHART_SURFACE_HEIGHT,
  CHART_SURFACE_WIDTH,
  createChartOption,
  type ChartModel,
} from '../utils'

const props = defineProps<{
  chart: ChartModel
  resetRevision: number
}>()
const zoomPanCanvas = useTemplateRef<InstanceType<typeof ZoomPanCanvas>>('zoomPanCanvas')
const chartHost = useTemplateRef<HTMLDivElement>('chartHost')
let chartInstance: ECharts | null = null
const chartTypeLabel = computed(() => props.chart.settings.chartType === 'bar' ? '柱状图' : '折线图')
const chartSurfaceStyle = {
  width: `${CHART_SURFACE_WIDTH}px`,
  height: `${CHART_SURFACE_HEIGHT}px`,
}

function updateChart() {
  chartInstance?.setOption(createChartOption(props.chart), { notMerge: true, lazyUpdate: false })
}

onMounted(() => {
  if (!chartHost.value) return
  chartInstance = init(chartHost.value, undefined, {
    renderer: 'canvas',
    width: CHART_SURFACE_WIDTH,
    height: CHART_SURFACE_HEIGHT,
  })
  updateChart()
  void document.fonts?.ready.then(() => updateChart())
})
watch(() => props.chart, updateChart)
watch(() => props.resetRevision, () => zoomPanCanvas.value?.reset())
onBeforeUnmount(() => {
  const instance = chartInstance
  chartInstance = null
  instance?.dispose()
})
</script>

<template>
  <section class="h-full min-h-0 min-w-0 w-full grid grid-rows-[32px_minmax(0,1fr)] px-7.5 pb-7.5 pt-6" :aria-label="`${chartTypeLabel}预览`">
    <div class="text-right text-caption">共 {{ chart.labels.length }} 条数据</div>
    <ZoomPanCanvas ref="zoomPanCanvas" aria-label="图表缩放画布">
      <div class="chart-panel relative h-max w-max border border-base rounded-1.5 bg-base p-[10px] shadow-[0_8px_22px_rgb(30_42_64/5%)]">
        <div
          ref="chartHost"
          class="flex-none"
          :style="chartSurfaceStyle"
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
