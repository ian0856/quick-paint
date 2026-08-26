<script setup lang="ts">
import { ElColorPicker, ElInput, ElInputNumber, ElSegmented, ElSwitch } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'
import {
  MAX_AXIS_NAME_LENGTH,
  MAX_AXIS_UNIT_LENGTH,
  MAX_CHART_FONT_SIZE,
  MIN_CHART_FONT_SIZE,
  validateFixedYAxisTickInterval,
  type YAxisTickIntervalMode,
} from '../utils'

const props = defineProps<{
  xAxisName: string
  yAxisName: string
  xAxisNameFontSize: number
  yAxisNameFontSize: number
  xAxisNameColor: string
  yAxisNameColor: string
  yAxisUnit: string
  showYAxisSplitLines: boolean
  xAxisTickLabelFontSize: number
  yAxisTickLabelFontSize: number
  xAxisTickLabelColor: string
  yAxisTickLabelColor: string
  intervalMode: YAxisTickIntervalMode
  fixedInterval: number
  yAxisSpan: number
  disabled: boolean
}>()

const emit = defineEmits<{
  updateXAxisName: [value: string]
  updateYAxisName: [value: string]
  updateXAxisNameFontSize: [value: number]
  updateYAxisNameFontSize: [value: number]
  updateXAxisNameColor: [value: string]
  updateYAxisNameColor: [value: string]
  updateYAxisUnit: [value: string]
  updateShowYAxisSplitLines: [value: boolean]
  updateXAxisTickLabelFontSize: [value: number]
  updateYAxisTickLabelFontSize: [value: number]
  updateXAxisTickLabelColor: [value: string]
  updateYAxisTickLabelColor: [value: string]
  updateIntervalMode: [mode: YAxisTickIntervalMode]
  updateFixedInterval: [value: number]
}>()

const intervalInput = shallowRef(String(props.fixedInterval))
const intervalOptions = [
  { label: '自动', value: 'auto' },
  { label: '固定', value: 'fixed' },
]
const intervalValidation = computed(() =>
  validateFixedYAxisTickInterval(intervalInput.value, props.yAxisSpan),
)
const intervalError = computed(() =>
  props.intervalMode === 'fixed' && !intervalValidation.value.valid
    ? intervalValidation.value.message
    : null,
)

watch(() => props.fixedInterval, (value) => {
  intervalInput.value = String(value)
})

function updateIntervalInput(value: string) {
  intervalInput.value = value
  const validation = intervalValidation.value
  if (validation.valid) emit('updateFixedInterval', validation.value)
}

function updateXAxisTickLabelFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateXAxisTickLabelFontSize', value)
}

function updateXAxisNameFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateXAxisNameFontSize', value)
}

function updateYAxisNameFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateYAxisNameFontSize', value)
}

function updateXAxisNameColor(color: string | null) {
  if (color) emit('updateXAxisNameColor', color)
}

function updateYAxisNameColor(color: string | null) {
  if (color) emit('updateYAxisNameColor', color)
}

function updateYAxisTickLabelFontSize(value: number | undefined) {
  if (value !== undefined) emit('updateYAxisTickLabelFontSize', value)
}

function updateXAxisTickLabelColor(color: string | null) {
  if (color) emit('updateXAxisTickLabelColor', color)
}

function updateYAxisTickLabelColor(color: string | null) {
  if (color) emit('updateYAxisTickLabelColor', color)
}
</script>

<template>
  <section aria-labelledby="axis-settings-title">
    <h3 id="axis-settings-title" class="m-0 text-xs font-600 text-text-strong">坐标轴</h3>

    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">显示 Y 轴分割线</span>
      <ElSwitch
        :model-value="showYAxisSplitLines"
        :disabled="disabled"
        aria-label="显示 Y 轴分割线"
        @change="emit('updateShowYAxisSplitLines', $event as boolean)"
      />
    </div>

    <label class="control-label block" for="x-axis-name">x轴名称</label>
    <ElInput
      id="x-axis-name"
      :model-value="xAxisName"
      :disabled="disabled"
      :maxlength="MAX_AXIS_NAME_LENGTH"
      aria-label="x轴名称"
      @input="emit('updateXAxisName', $event)"
    />

    <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div>
        <label class="control-label mt-0 block" for="x-axis-name-font-size">x轴名称字体大小</label>
        <ElInputNumber
          id="x-axis-name-font-size"
          class="mt-1 w-full"
          :model-value="xAxisNameFontSize"
          :disabled="disabled"
          :min="MIN_CHART_FONT_SIZE"
          :max="MAX_CHART_FONT_SIZE"
          :step="1"
          :precision="0"
          controls-position="right"
          aria-label="x轴名称字体大小"
          @change="updateXAxisNameFontSize"
        />
      </div>
      <div>
        <span class="control-label mt-0 block">字体颜色</span>
        <ElColorPicker
          class="mt-1"
          :model-value="xAxisNameColor"
          :disabled="disabled"
          :show-alpha="false"
          aria-label="x轴名称字体颜色"
          @change="updateXAxisNameColor"
        />
      </div>
    </div>

    <label class="control-label block" for="y-axis-name">y轴名称</label>
    <ElInput
      id="y-axis-name"
      :model-value="yAxisName"
      :disabled="disabled"
      :maxlength="MAX_AXIS_NAME_LENGTH"
      aria-label="y轴名称"
      @input="emit('updateYAxisName', $event)"
    />

    <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div>
        <label class="control-label mt-0 block" for="y-axis-name-font-size">y轴名称字体大小</label>
        <ElInputNumber
          id="y-axis-name-font-size"
          class="mt-1 w-full"
          :model-value="yAxisNameFontSize"
          :disabled="disabled"
          :min="MIN_CHART_FONT_SIZE"
          :max="MAX_CHART_FONT_SIZE"
          :step="1"
          :precision="0"
          controls-position="right"
          aria-label="y轴名称字体大小"
          @change="updateYAxisNameFontSize"
        />
      </div>
      <div>
        <span class="control-label mt-0 block">字体颜色</span>
        <ElColorPicker
          class="mt-1"
          :model-value="yAxisNameColor"
          :disabled="disabled"
          :show-alpha="false"
          aria-label="y轴名称字体颜色"
          @change="updateYAxisNameColor"
        />
      </div>
    </div>

    <label class="control-label block" for="y-axis-unit">y轴单位</label>
    <ElInput
      id="y-axis-unit"
      :model-value="yAxisUnit"
      :disabled="disabled"
      :maxlength="MAX_AXIS_UNIT_LENGTH"
      aria-label="y轴单位"
      @input="emit('updateYAxisUnit', $event)"
    />

    <div class="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div>
        <label class="control-label mt-0 block" for="x-axis-tick-label-font-size">x轴刻度文本字体大小</label>
        <ElInputNumber
          id="x-axis-tick-label-font-size"
          class="mt-1 w-full"
          :model-value="xAxisTickLabelFontSize"
          :disabled="disabled"
          :min="MIN_CHART_FONT_SIZE"
          :max="MAX_CHART_FONT_SIZE"
          :step="1"
          :precision="0"
          controls-position="right"
          aria-label="x轴刻度文本字体大小"
          @change="updateXAxisTickLabelFontSize"
        />
      </div>
      <div>
        <span class="control-label mt-0 block">文本颜色</span>
        <ElColorPicker
          class="mt-1"
          :model-value="xAxisTickLabelColor"
          :disabled="disabled"
          :show-alpha="false"
          aria-label="x轴刻度文本颜色"
          @change="updateXAxisTickLabelColor"
        />
      </div>
    </div>

    <div class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div>
        <label class="control-label mt-0 block" for="y-axis-tick-label-font-size">y轴刻度文本字体大小</label>
        <ElInputNumber
          id="y-axis-tick-label-font-size"
          class="mt-1 w-full"
          :model-value="yAxisTickLabelFontSize"
          :disabled="disabled"
          :min="MIN_CHART_FONT_SIZE"
          :max="MAX_CHART_FONT_SIZE"
          :step="1"
          :precision="0"
          controls-position="right"
          aria-label="y轴刻度文本字体大小"
          @change="updateYAxisTickLabelFontSize"
        />
      </div>
      <div>
        <span class="control-label mt-0 block">文本颜色</span>
        <ElColorPicker
          class="mt-1"
          :model-value="yAxisTickLabelColor"
          :disabled="disabled"
          :show-alpha="false"
          aria-label="y轴刻度文本颜色"
          @change="updateYAxisTickLabelColor"
        />
      </div>
    </div>

    <span class="control-label block">y轴刻度间隔</span>
    <ElSegmented
      class="mt-1 w-full"
      :model-value="intervalMode"
      :options="intervalOptions"
      :disabled="disabled"
      aria-label="y轴刻度间隔模式"
      @change="emit('updateIntervalMode', $event as YAxisTickIntervalMode)"
    />

    <div v-if="intervalMode === 'fixed'" class="mt-2">
      <ElInput
        :model-value="intervalInput"
        :disabled="disabled"
        inputmode="decimal"
        aria-label="固定y轴刻度间隔"
        :aria-invalid="Boolean(intervalError)"
        @input="updateIntervalInput"
      />
      <p v-if="intervalError" class="m-0 mt-1 text-[11px] leading-4 text-danger" role="alert">{{ intervalError }}</p>
    </div>
  </section>
</template>
