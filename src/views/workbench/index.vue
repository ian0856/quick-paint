<script setup lang="ts">
import AppHeader from './_components/AppHeader.vue'
import ChartStage from './_components/ChartStage.vue'
import CompositionInspector from './_components/CompositionInspector.vue'
import DataSourcePanel from './_components/DataSourcePanel.vue'
</script>

<template>
  <main class="home-view">
    <AppHeader />
    <div class="workspace">
      <DataSourcePanel />
      <ChartStage />
      <CompositionInspector />
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
