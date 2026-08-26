<script setup lang="ts">
import { ElInputNumber, ElSegmented } from 'element-plus'
import { MAX_CHART_FONT_SIZE, MIN_CHART_FONT_SIZE } from '../utils'
import type { LegendLayout, LegendPosition } from '../utils'

defineProps<{
  fontSize: number
  layout: LegendLayout
  position: LegendPosition
  disabled: boolean
}>()

const emit = defineEmits<{
  updateFontSize: [value: number]
  updateLayout: [value: LegendLayout]
  updatePosition: [value: LegendPosition]
}>()

const layoutOptions = [
  { label: '横向', value: 'horizontal' },
  { label: '纵向', value: 'vertical' },
]
const positionOptions = [
  { label: '靠左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '靠右', value: 'right' },
]

function updateFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateFontSize', value)
}
</script>

<template>
  <section aria-labelledby="chart-label-settings-title">
    <h3 id="chart-label-settings-title" class="m-0 text-xs font-600 text-text-strong">图例</h3>
    <label class="control-label block" for="chart-label-font-size">字体大小</label>
    <ElInputNumber
      id="chart-label-font-size"
      class="mt-1 w-full"
      :model-value="fontSize"
      :disabled="disabled"
      :min="MIN_CHART_FONT_SIZE"
      :max="MAX_CHART_FONT_SIZE"
      :step="1"
      :precision="0"
      controls-position="right"
      aria-label="图例字体大小"
      @change="updateFontSize"
    />
    <label class="control-label block" for="legend-layout">布局</label>
    <ElSegmented
      id="legend-layout"
      class="mt-1 w-full"
      :model-value="layout"
      :options="layoutOptions"
      :disabled="disabled"
      aria-label="图例布局"
      @change="emit('updateLayout', $event as LegendLayout)"
    />
    <label class="control-label block" for="legend-position">位置</label>
    <ElSegmented
      id="legend-position"
      class="mt-1 w-full"
      :model-value="position"
      :options="positionOptions"
      :disabled="disabled"
      aria-label="图例位置"
      @change="emit('updatePosition', $event as LegendPosition)"
    />
  </section>
</template>
