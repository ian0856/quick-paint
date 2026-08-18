<script setup lang="ts">
import { ElCheckbox, ElInput } from 'element-plus'
import { computed } from 'vue'
import type { WorkbenchComposition } from '../../workbenchModel'
import { seriesPalette } from '../inspectorOptions'

const props = defineProps<{
  title: string
  selectedColor: string
  showLegend: boolean
  showDataLabels: boolean
}>()

const emit = defineEmits<{ update: [patch: Partial<WorkbenchComposition>] }>()

const titleModel = computed({
  get: () => props.title,
  set: (title: string) => emit('update', { title }),
})
const legendModel = computed({
  get: () => props.showLegend,
  set: (showLegend: boolean) => emit('update', { showLegend }),
})
const dataLabelsModel = computed({
  get: () => props.showDataLabels,
  set: (showDataLabels: boolean) => emit('update', { showDataLabels }),
})

function chooseColor(selectedColor: (typeof seriesPalette)[number]) {
  emit('update', { selectedColor })
}
</script>

<template>
  <section class="inspector-section">
    <h2 class="section-title"><span class="section-number">03</span>外观</h2>
    <div class="control-group">
      <label class="control-label">标题</label>
      <ElInput v-model="titleModel" maxlength="60" show-word-limit />
    </div>
    <div class="appearance-row">
      <div class="palette-control">
        <span class="control-label">Series 配色</span>
        <div class="swatches">
          <button
            v-for="color in seriesPalette"
            :key="color"
            type="button"
            class="swatch"
            :class="{ 'is-selected': selectedColor === color }"
            :style="{ backgroundColor: color }"
            :aria-label="`选择颜色 ${color}`"
            :aria-pressed="selectedColor === color"
            @click="chooseColor(color)"
          />
        </div>
      </div>
      <div class="toggles">
        <ElCheckbox v-model="legendModel">图例</ElCheckbox>
        <ElCheckbox v-model="dataLabelsModel">数据标签</ElCheckbox>
      </div>
    </div>
  </section>
</template>

<style scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.control-label {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
}

.appearance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
}

.palette-control {
  min-width: 0;
}

.swatches {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid var(--surface);
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--border-strong);
  cursor: pointer;
}

.swatch.is-selected {
  box-shadow: 0 0 0 2px var(--primary);
}

.swatch:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

.toggles {
  display: flex;
  flex-direction: column;
}

.toggles :deep(.el-checkbox) {
  height: 23px;
  margin-right: 0;
}
</style>
