<script setup lang="ts">
import WorkbenchSidebar from './_components/WorkbenchSidebar.vue'
import WorkbenchStage from './_components/WorkbenchStage.vue'
import { useWorkbench } from './useWorkbench'

const workbench = useWorkbench()
</script>

<template>
  <div class="h-screen min-h-0 min-w-0 w-full flex overflow-hidden">
    <WorkbenchSidebar
      :data-source="workbench.dataSource.value"
      :worksheets="workbench.worksheets.value"
      :worksheet="workbench.selectedWorksheet.value"
      :worksheet-id="workbench.selectedWorksheetId.value"
      :category-field-id="workbench.categoryFieldId.value"
      :value-field-id="workbench.valueFieldId.value"
      :title="workbench.title.value"
      :view-mode="workbench.viewMode.value"
      :is-parsing="workbench.isParsing.value"
      :controls-disabled="workbench.controlsDisabled.value"
      :export-disabled="workbench.exportDisabled.value"
      :is-exporting="workbench.isExporting.value"
      :export-error="workbench.exportError.value"
      :export-success="workbench.exportSuccess.value"
      @import-file="workbench.importFile"
      @select-worksheet="workbench.selectWorksheet"
      @select-category-field="workbench.selectCategoryField"
      @select-value-field="workbench.selectValueField"
      @update-title="workbench.updateTitle"
      @change-view="workbench.changeView"
      @export-chart="workbench.exportChart"
    />
    <WorkbenchStage
      :data-source="workbench.dataSource.value"
      :worksheet="workbench.selectedWorksheet.value"
      :view-mode="workbench.viewMode.value"
      :chart-resolution="workbench.chartResolution.value"
      :chart="workbench.chart.value"
      :is-parsing="workbench.isParsing.value"
      :parse-failure="workbench.parseFailure.value"
      :replacement-failure="workbench.replacementFailure.value"
      @dismiss-replacement-failure="workbench.dismissReplacementFailure"
    />
  </div>
</template>
