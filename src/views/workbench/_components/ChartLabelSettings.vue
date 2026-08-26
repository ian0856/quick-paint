<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import { MAX_CHART_FONT_SIZE, MIN_CHART_FONT_SIZE } from '../utils'

defineProps<{
  fontSize: number
  disabled: boolean
}>()

const emit = defineEmits<{
  updateFontSize: [value: number]
}>()

function updateFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateFontSize', value)
}
</script>

<template>
  <section aria-labelledby="chart-label-settings-title">
    <h3 id="chart-label-settings-title" class="m-0 text-xs font-600 text-text-strong">图像标签</h3>
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
      aria-label="图像标签字体大小"
      @change="updateFontSize"
    />
  </section>
</template>
