<script setup lang="ts">
import { ElColorPicker, ElInputNumber, ElSwitch } from 'element-plus'
import { MAX_CHART_FONT_SIZE, MIN_CHART_FONT_SIZE } from '../utils'

defineProps<{
  showDetails: boolean
  fontSize: number
  color: string
  disabled: boolean
}>()

const emit = defineEmits<{
  updateShowDetails: [value: boolean]
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
  <section aria-labelledby="chart-detail-settings-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="chart-detail-settings-title" class="m-0 text-xs font-600 text-text-strong">显示详情</h3>
      <ElSwitch
        :model-value="showDetails"
        :disabled="disabled"
        aria-label="显示数据详情"
        @change="emit('updateShowDetails', $event as boolean)"
      />
    </div>

    <div v-if="showDetails" class="mt-4 border-t border-base pt-4">
      <h4 class="m-0 text-xs font-600 text-text-strong">详情字段</h4>
      <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div>
          <label class="control-label mt-0 block" for="detail-label-font-size">字体大小</label>
          <ElInputNumber
            id="detail-label-font-size"
            class="mt-1 w-full"
            :model-value="fontSize"
            :disabled="disabled"
            :min="MIN_CHART_FONT_SIZE"
            :max="MAX_CHART_FONT_SIZE"
            :step="1"
            :precision="0"
            controls-position="right"
            aria-label="详情字段字体大小"
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
            aria-label="详情字段字体颜色"
            @change="updateColor"
          />
        </div>
      </div>
    </div>
  </section>
</template>
