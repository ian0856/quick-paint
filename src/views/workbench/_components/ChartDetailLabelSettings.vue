<script setup lang="ts">
import { ElColorPicker, ElInputNumber, ElSwitch } from 'element-plus'
import { MAX_CHART_FONT_SIZE, MIN_CHART_FONT_SIZE } from '../utils'
import type { ChartType, FieldId } from '../utils'

type DetailLabelField = {
  fieldId: FieldId
  label: string
  color: string
}

defineProps<{
  showDetailLabels: boolean
  showInsideBars: boolean
  chartType: ChartType
  fontSize: number
  fields: DetailLabelField[]
  disabled: boolean
}>()

const emit = defineEmits<{
  updateShowDetailLabels: [value: boolean]
  updateShowInsideBars: [value: boolean]
  updateFontSize: [value: number]
  updateColor: [fieldId: FieldId, value: string]
}>()

function updateFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateFontSize', value)
}

function updateColor(fieldId: FieldId, color: string | null) {
  if (color) emit('updateColor', fieldId, color)
}
</script>

<template>
  <section aria-labelledby="chart-detail-settings-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="chart-detail-settings-title" class="m-0 text-xs font-600 text-text-strong">显示详情</h3>
      <ElSwitch
        :model-value="showDetailLabels"
        :disabled="disabled"
        aria-label="显示数据详情"
        @change="emit('updateShowDetailLabels', $event as boolean)"
      />
    </div>

    <div v-if="showDetailLabels" class="mt-4 border-t border-base pt-4">
      <div v-if="chartType === 'bar'" class="mb-4 flex items-center justify-between gap-3">
        <span class="text-xs font-600 text-text-strong">显示在柱内部</span>
        <ElSwitch
          :model-value="showInsideBars"
          :disabled="disabled"
          aria-label="显示在柱内部"
          @change="emit('updateShowInsideBars', $event as boolean)"
        />
      </div>
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
      <h4 class="mb-0 mt-4 text-xs font-600 text-text-strong">字段颜色</h4>
      <div
        v-for="field in fields"
        :key="field.fieldId"
        class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-base pb-2 last:border-b-0"
      >
        <span class="min-w-0 break-words text-xs text-text" :title="field.label">{{ field.label }}</span>
        <div>
          <ElColorPicker
            :model-value="field.color"
            :disabled="disabled"
            :show-alpha="false"
            :aria-label="`详情颜色：${field.label}`"
            @change="updateColor(field.fieldId, $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
