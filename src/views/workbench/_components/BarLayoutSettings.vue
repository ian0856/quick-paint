<script setup lang="ts">
import { ElSlider, ElSwitch } from 'element-plus'
import { MAX_MAX_BAR_THICKNESS, MIN_MAX_BAR_THICKNESS } from '../utils'

defineProps<{
  maxBarThickness: number
  roundedBars: boolean
  showBarBackground: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  updateMaxBarThickness: [value: number]
  updateRoundedBars: [value: boolean]
  updateShowBarBackground: [value: boolean]
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
    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">圆角柱</span>
      <ElSwitch
        :model-value="roundedBars"
        :disabled="disabled"
        aria-label="圆角柱"
        @change="emit('updateRoundedBars', $event as boolean)"
      />
    </div>
    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">显示柱背景</span>
      <ElSwitch
        :model-value="showBarBackground"
        :disabled="disabled"
        aria-label="显示柱背景"
        @change="emit('updateShowBarBackground', $event as boolean)"
      />
    </div>
  </section>
</template>
