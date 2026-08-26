<script setup lang="ts">
import { ElSwitch } from 'element-plus'

defineProps<{
  roundedBars: boolean
  showBarBackground: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  updateRoundedBars: [value: boolean]
  updateShowBarBackground: [value: boolean]
}>()
</script>

<template>
  <section aria-labelledby="bar-layout-settings-title">
    <h3 id="bar-layout-settings-title" class="m-0 text-xs font-600 text-text-strong">柱形</h3>
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
