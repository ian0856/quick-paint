<script setup lang="ts">
import { ElSlider } from 'element-plus'
import { MAX_MAX_BAR_THICKNESS, MIN_MAX_BAR_THICKNESS } from '../utils'

defineProps<{
  maxBarThickness: number
  disabled: boolean
}>()

const emit = defineEmits<{
  updateMaxBarThickness: [value: number]
}>()
</script>

<template>
  <section aria-labelledby="bar-layout-settings-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="bar-layout-settings-title" class="m-0 text-xs font-600 text-text-strong">柱形</h3>
      <output class="w-13 flex-none text-right text-xs tabular-nums text-text">{{ maxBarThickness }} px</output>
    </div>
    <ElSlider
      class="mt-2"
      :model-value="maxBarThickness"
      :disabled="disabled"
      :min="MIN_MAX_BAR_THICKNESS"
      :max="MAX_MAX_BAR_THICKNESS"
      :step="1"
      :show-tooltip="true"
      aria-label="最大柱宽"
      @input="emit('updateMaxBarThickness', $event as number)"
    />
  </section>
</template>
