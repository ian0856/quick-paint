<script setup lang="ts">
import { ElSegmented, ElSwitch } from 'element-plus'
import type { ChartType, LineStyle } from '../utils'

defineProps<{
  chartType: ChartType
  lineStyle: LineStyle
  areaFill: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  updateChartType: [value: ChartType]
  updateLineStyle: [value: LineStyle]
  updateAreaFill: [value: boolean]
}>()

const chartTypeOptions = [
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
]
const lineStyleOptions = [
  { label: '直线', value: 'straight' },
  { label: '平滑', value: 'smooth' },
]
</script>

<template>
  <section aria-labelledby="chart-type-settings-title">
    <h3 id="chart-type-settings-title" class="m-0 text-xs font-600 text-text-strong">图表类型</h3>
    <ElSegmented
      class="mt-3 w-full"
      :model-value="chartType"
      :options="chartTypeOptions"
      :disabled="disabled"
      aria-label="图表类型"
      @change="emit('updateChartType', $event as ChartType)"
    />

    <template v-if="chartType === 'line'">
      <h3 class="mb-0 mt-4 text-xs font-600 text-text-strong">折线样式</h3>
      <ElSegmented
        class="mt-3 w-full"
        :model-value="lineStyle"
        :options="lineStyleOptions"
        :disabled="disabled"
        aria-label="折线样式"
        @change="emit('updateLineStyle', $event as LineStyle)"
      />
      <div class="mt-4 flex items-center justify-between gap-3">
        <span class="text-xs font-600 text-text-strong">显示面积</span>
        <ElSwitch
          :model-value="areaFill"
          :disabled="disabled"
          aria-label="显示线下半透明面积"
          @change="emit('updateAreaFill', $event as boolean)"
        />
      </div>
    </template>
  </section>
</template>
