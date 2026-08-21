<script setup lang="ts">
import { Chart } from 'chart.js/auto'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import ZoomPanCanvas from '../../../components/ZoomPanCanvas.vue'
import { createChartConfig, type ChartModel } from '../utils'

const props = defineProps<{
  chart: ChartModel
  resetRevision: number
}>()
const zoomPanCanvas = useTemplateRef<InstanceType<typeof ZoomPanCanvas>>('zoomPanCanvas')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let chartInstance: Chart | null = null

function renderChart() {
  if (!canvas.value) return
  chartInstance?.destroy()
  chartInstance = new Chart(canvas.value, createChartConfig(props.chart, { responsive: true }))
}

onMounted(renderChart)
watch(() => props.chart, renderChart)
watch(() => props.resetRevision, () => zoomPanCanvas.value?.reset())
onBeforeUnmount(() => chartInstance?.destroy())
</script>

<template>
  <section class="h-full min-h-0 min-w-0 w-full grid grid-rows-[32px_minmax(0,1fr)] px-7.5 pb-7.5 pt-6" :aria-label="`${chart.type === 'bar' ? '柱状图' : '折线图'}预览`">
    <div class="text-right text-caption">共 {{ chart.labels.length }} 条数据</div>
    <ZoomPanCanvas ref="zoomPanCanvas" aria-label="图表缩放画布">
      <div class="chart-panel relative h-full min-h-0 min-w-0 border border-base rounded-1.5 bg-base px-7 pb-4.5 pt-6 shadow-[0_8px_22px_rgb(30_42_64/5%)]">
        <canvas
          ref="canvas"
          role="img"
          :aria-label="`${chart.type === 'bar' ? '柱状图' : '折线图'}：${chart.title}，共 ${chart.labels.length} 条数据，${chart.series.length} 个数值系列`"
        />
        <table class="sr-only" :aria-label="`${chart.type === 'bar' ? '柱状图' : '折线图'}数据`">
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
