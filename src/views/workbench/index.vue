<script setup lang="ts">
import { computed, reactive } from 'vue'
import AppHeader from './_components/AppHeader.vue'
import ChartStage from './_components/ChartStage.vue'
import CompositionInspector from './_components/CompositionInspector.vue'
import DataSourcePanel from './_components/DataSourcePanel.vue'
import { resolveChartComposition } from './chartComposition'
import { demoWorksheet } from './demoWorksheet'
import { defaultComposition } from './workbenchModel'
import type { ChartType, WorkbenchComposition } from './workbenchModel'

const composition = reactive<WorkbenchComposition>({
  ...defaultComposition,
  valueFieldIds: [...defaultComposition.valueFieldIds],
})

const compositionResult = computed(() =>
  resolveChartComposition(demoWorksheet, {
    chartType: composition.chartType,
    categoryFieldId: composition.categoryFieldId,
    valueFieldIds: composition.valueFieldIds,
  }),
)
const compositionReady = computed(() => compositionResult.value.valid)

function changeChartType(nextType: ChartType) {
  const categorySeriesTypes: ChartType[] = ['bar', 'line']
  const preservesMapping =
    composition.chartType !== null &&
    categorySeriesTypes.includes(composition.chartType) &&
    categorySeriesTypes.includes(nextType)

  composition.chartType = nextType
  if (!preservesMapping) {
    composition.categoryFieldId = null
    composition.valueFieldIds = []
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
      <DataSourcePanel :worksheet="demoWorksheet" :composition-ready="compositionReady" />
      <ChartStage
        :worksheet="demoWorksheet"
        :composition="composition"
        :result="compositionResult"
      />
      <CompositionInspector
        :worksheet="demoWorksheet"
        :composition="composition"
        :result="compositionResult"
        @change-chart-type="changeChartType"
        @update-composition="updateComposition"
      />
    </div>
  </main>
</template>

<style scoped>
.home-view {
  height: 100vh;
  min-width: 0;
  min-height: 100vh;
  overflow: hidden;
  background: var(--surface-subtle);
}

.workspace {
  display: grid;
  grid-template-columns: 252px minmax(520px, 1fr) 336px;
  height: calc(100vh - 60px);
  min-height: 0;
}
</style>
