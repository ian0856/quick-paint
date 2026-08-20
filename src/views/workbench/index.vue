<script setup lang="ts">
import WorkbenchHeader from './_components/WorkbenchHeader.vue'
import WorkbenchSidebar from './_components/WorkbenchSidebar.vue'
import WorkbenchStage from './_components/WorkbenchStage.vue'
</script>

<template>
  <div class="h-screen min-h-0 min-w-0 w-full flex flex-col overflow-hidden sm:flex-row">
    <WorkbenchSidebar />
    <div class="min-h-0 min-w-0 flex flex-1 flex-col">
      <WorkbenchHeader />
      <WorkbenchStage />
    </div>
  </div>
</template>
