<script setup lang="ts">
import { ElTag } from 'element-plus'
import type { ChartType, WorkbenchComposition } from '../workbenchModel'
import AppearanceSection from './inspector/AppearanceSection.vue'
import ChartImageSection from './inspector/ChartImageSection.vue'
import ChartTypeSection from './inspector/ChartTypeSection.vue'
import FieldMappingSection from './inspector/FieldMappingSection.vue'

defineProps<{
  composition: WorkbenchComposition
  ready: boolean
}>()

const emit = defineEmits<{
  changeChartType: [chartType: ChartType]
  updateComposition: [patch: Partial<WorkbenchComposition>]
}>()
</script>

<template>
  <aside class="inspector" aria-label="Chart Composition">
    <div class="inspector-heading">
      <div class="heading-copy">
        <strong class="heading-title">Chart Composition</strong>
        <small class="heading-subtitle">分组检查器</small>
      </div>
      <ElTag :type="ready ? 'success' : 'warning'" size="small" effect="light">
        {{ ready ? '有效' : '未完成' }}
      </ElTag>
    </div>

    <div class="inspector-scroll">
      <ChartTypeSection
        :chart-type="composition.chartType"
        @change="emit('changeChartType', $event)"
      />
      <FieldMappingSection
        :chart-type="composition.chartType"
        :category-field="composition.categoryField"
        :series-fields="composition.seriesFields"
        :ready="ready"
        @update-category="emit('updateComposition', { categoryField: $event })"
        @update-series="emit('updateComposition', { seriesFields: $event })"
      />
      <AppearanceSection
        :title="composition.title"
        :selected-color="composition.selectedColor"
        :show-legend="composition.showLegend"
        :show-data-labels="composition.showDataLabels"
        @update="emit('updateComposition', $event)"
      />
      <ChartImageSection
        :width="composition.width"
        :height="composition.height"
        @update="emit('updateComposition', $event)"
      />
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  min-width: 0;
  border-left: 1px solid var(--border);
  background: var(--surface);
}

.inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
}

.heading-copy {
  display: flex;
  flex-direction: column;
}

.heading-title {
  color: var(--text-strong);
  font-size: 12px;
}

.heading-subtitle {
  color: var(--text-muted);
  font-size: 9px;
}

.inspector-scroll {
  height: calc(100vh - 108px);
  overflow: auto;
}

.inspector-scroll :deep(.inspector-section) {
  padding: 17px 16px 18px;
  border-bottom: 1px solid var(--border);
}

.inspector-scroll :deep(.section-title) {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 14px;
  color: var(--text-strong);
  font-size: 12px;
  line-height: 1;
}

.inspector-scroll :deep(.section-number) {
  color: var(--primary);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}
</style>
