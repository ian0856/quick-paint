<script setup lang="ts">
import { ElInput, ElSegmented } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'
import {
  MAX_AXIS_NAME_LENGTH,
  validateFixedValueAxisTickInterval,
  type ValueAxisTickIntervalMode,
} from '../utils'

const props = defineProps<{
  categoryAxisName: string
  valueAxisName: string
  intervalMode: ValueAxisTickIntervalMode
  fixedInterval: number
  valueSpan: number
  disabled: boolean
}>()

const emit = defineEmits<{
  updateCategoryAxisName: [value: string]
  updateValueAxisName: [value: string]
  updateIntervalMode: [mode: ValueAxisTickIntervalMode]
  updateFixedInterval: [value: number]
}>()

const intervalInput = shallowRef(String(props.fixedInterval))
const intervalOptions = [
  { label: '自动', value: 'auto' },
  { label: '固定', value: 'fixed' },
]
const intervalValidation = computed(() =>
  validateFixedValueAxisTickInterval(intervalInput.value, props.valueSpan),
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
</script>

<template>
  <section aria-labelledby="axis-settings-title">
    <h3 id="axis-settings-title" class="m-0 text-xs font-600 text-text-strong">坐标轴</h3>

    <label class="control-label block" for="category-axis-name">分类轴名称</label>
    <ElInput
      id="category-axis-name"
      :model-value="categoryAxisName"
      :disabled="disabled"
      :maxlength="MAX_AXIS_NAME_LENGTH"
      aria-label="分类轴名称"
      @input="emit('updateCategoryAxisName', $event)"
    />

    <label class="control-label block" for="value-axis-name">数值轴名称</label>
    <ElInput
      id="value-axis-name"
      :model-value="valueAxisName"
      :disabled="disabled"
      :maxlength="MAX_AXIS_NAME_LENGTH"
      aria-label="数值轴名称"
      @input="emit('updateValueAxisName', $event)"
    />

    <span class="control-label block">数值轴刻度间隔</span>
    <ElSegmented
      class="mt-1 w-full"
      :model-value="intervalMode"
      :options="intervalOptions"
      :disabled="disabled"
      aria-label="数值轴刻度间隔模式"
      @change="emit('updateIntervalMode', $event as ValueAxisTickIntervalMode)"
    />

    <div v-if="intervalMode === 'fixed'" class="mt-2">
      <ElInput
        :model-value="intervalInput"
        :disabled="disabled"
        inputmode="decimal"
        aria-label="固定数值轴刻度间隔"
        :aria-invalid="Boolean(intervalError)"
        @input="updateIntervalInput"
      />
      <p v-if="intervalError" class="m-0 mt-1 text-[11px] leading-4 text-danger" role="alert">{{ intervalError }}</p>
    </div>
  </section>
</template>
