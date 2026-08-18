<script setup lang="ts">
import { computed, reactive } from 'vue'
import AppHeader from './_components/AppHeader.vue'
import ChartStage from './_components/ChartStage.vue'
import CompositionInspector from './_components/CompositionInspector.vue'
import DataSourcePanel from './_components/DataSourcePanel.vue'
import { defaultComposition } from './workbenchModel'
import type { ChartType, WorkbenchComposition } from './workbenchModel'

const composition = reactive<WorkbenchComposition>({
  ...defaultComposition,
  seriesFields: [...defaultComposition.seriesFields],
})

const compositionReady = computed(
  () => composition.categoryField.length > 0 && composition.seriesFields.length > 0,
)

function changeChartType(nextType: ChartType) {
  const categorySeriesTypes: ChartType[] = ['bar', 'line']
  const preservesMapping =
    categorySeriesTypes.includes(composition.chartType) && categorySeriesTypes.includes(nextType)

  composition.chartType = nextType
  if (!preservesMapping) {
    composition.categoryField = ''
    composition.seriesFields = []
  }
}

function updateComposition(patch: Partial<WorkbenchComposition>) {
  Object.assign(composition, patch)
}
</script>

<template>
  <main class="home-view">
    <AppHeader :ready="compositionReady" />
    <div class="workspace">
      <DataSourcePanel :composition-ready="compositionReady" />
      <ChartStage :composition="composition" :ready="compositionReady" />
      <CompositionInspector
        :composition="composition"
        :ready="compositionReady"
        @change-chart-type="changeChartType"
        @update-composition="updateComposition"
      />
    </div>
  </main>
</template>

<style scoped>
.home-view {
  min-width: 1180px;
  min-height: 100vh;
  background: var(--surface-subtle);
}

.workspace {
  display: grid;
  grid-template-columns: 252px minmax(520px, 1fr) 336px;
  min-height: calc(100vh - 60px);
}
</style>
