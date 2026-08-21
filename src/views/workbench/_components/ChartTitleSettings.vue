<script setup lang="ts">
import { ElColorPicker, ElInput, ElInputNumber } from 'element-plus'
import {
  MAX_CHART_FONT_SIZE,
  MAX_CHART_TITLE_LENGTH,
  MIN_CHART_FONT_SIZE,
} from '../utils'

defineProps<{
  title: string
  fontSize: number
  color: string
  disabled: boolean
}>()

const emit = defineEmits<{
  updateTitle: [value: string]
  updateFontSize: [value: number]
  updateColor: [value: string]
}>()

function updateFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateFontSize', value)
}

function updateColor(color: string | null) {
  if (color) emit('updateColor', color)
}
</script>

<template>
  <section aria-labelledby="chart-title-settings-title">
    <h3 id="chart-title-settings-title" class="m-0 text-xs font-600 text-text-strong">标题</h3>

    <label class="control-label block" for="chart-title">名称</label>
    <ElInput
      id="chart-title"
      :model-value="title"
      :disabled="disabled"
      :maxlength="MAX_CHART_TITLE_LENGTH"
      aria-label="图表标题"
      @input="emit('updateTitle', $event)"
    />

    <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div>
        <label class="control-label mt-0 block" for="chart-title-font-size">字体大小</label>
        <ElInputNumber
          id="chart-title-font-size"
          class="mt-1 w-full"
          :model-value="fontSize"
          :disabled="disabled"
          :min="MIN_CHART_FONT_SIZE"
          :max="MAX_CHART_FONT_SIZE"
          :step="1"
          :precision="0"
          controls-position="right"
          aria-label="图表标题字体大小"
          @change="updateFontSize"
        />
      </div>
      <div>
        <span class="control-label mt-0 block">字体颜色</span>
        <ElColorPicker
          class="mt-1"
          :model-value="color"
          :disabled="disabled"
          :show-alpha="false"
          aria-label="图表标题字体颜色"
          @change="updateColor"
        />
      </div>
    </div>
  </section>
</template>
