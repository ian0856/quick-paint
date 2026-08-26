<script setup lang="ts">
import { ElColorPicker } from 'element-plus'

defineProps<{
  color: string
  disabled: boolean
}>()

const emit = defineEmits<{
  updateColor: [value: string]
}>()

function updateColor(color: string | null) {
  if (color) emit('updateColor', color)
}
</script>

<template>
  <section aria-labelledby="chart-canvas-settings-title">
    <h3 id="chart-canvas-settings-title" class="m-0 text-xs font-600 text-text-strong">画布</h3>
    <div class="mt-2 flex items-center justify-between gap-3">
      <span class="control-label m-0">颜色</span>
      <ElColorPicker
        :model-value="color"
        :disabled="disabled"
        :show-alpha="false"
        aria-label="画布颜色"
        @change="updateColor"
      />
    </div>
  </section>
</template>
