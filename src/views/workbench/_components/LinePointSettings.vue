<script setup lang="ts">
import { ElSwitch } from 'element-plus'

defineProps<{
  showPoints: boolean
  hollowPoints: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  updateShowPoints: [value: boolean]
  updateHollowPoints: [value: boolean]
}>()
</script>

<template>
  <section aria-labelledby="line-point-settings-title">
    <h3 id="line-point-settings-title" class="m-0 text-xs font-600 text-text-strong">节点</h3>
    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">显示节点</span>
      <ElSwitch
        :model-value="showPoints"
        :disabled="disabled"
        aria-label="显示节点"
        @change="emit('updateShowPoints', $event as boolean)"
      />
    </div>
    <div v-if="showPoints" class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">节点镂空</span>
      <ElSwitch
        :model-value="hollowPoints"
        :disabled="disabled"
        aria-label="节点镂空"
        @change="emit('updateHollowPoints', $event as boolean)"
      />
    </div>
  </section>
</template>
