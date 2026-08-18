<script setup lang="ts">
import { ElInputNumber } from 'element-plus'
import { computed } from 'vue'
import type { WorkbenchComposition } from '../../workbenchModel'

const props = defineProps<{ width: number; height: number }>()

const emit = defineEmits<{ update: [patch: Partial<WorkbenchComposition>] }>()

const widthModel = computed({
  get: () => props.width,
  set: (width: number | undefined) => {
    if (width !== undefined) emit('update', { width })
  },
})
const heightModel = computed({
  get: () => props.height,
  set: (height: number | undefined) => {
    if (height !== undefined) emit('update', { height })
  },
})
</script>

<template>
  <section class="inspector-section">
    <h2 class="section-title"><span class="section-number">04</span>Chart Image</h2>
    <div class="size-row">
      <ElInputNumber
        v-model="widthModel"
        :step="100"
        controls-position="right"
        aria-label="宽度"
      />
      <span class="size-separator">×</span>
      <ElInputNumber
        v-model="heightModel"
        :step="100"
        controls-position="right"
        aria-label="高度"
      />
      <small class="size-unit">px</small>
    </div>
  </section>
</template>

<style scoped>
.size-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
}

.size-row :deep(.el-input-number) {
  width: 100%;
}

.size-separator,
.size-unit {
  color: var(--text-muted);
  font-size: 10px;
}
</style>
