<script setup lang="ts">
import ChartSettingsPanel from './ChartSettingsPanel.vue'
</script>

<template>
  <aside class="hidden h-screen w-80 flex-none flex-col border-l border-base bg-base xl:flex" aria-label="高级设置侧边栏">
    <div class="h-15 flex flex-none items-center border-b border-base px-5">
      <h2 class="m-0 text-sm font-600 text-text-strong">高级设置</h2>
    </div>
    <ChartSettingsPanel />
  </aside>
</template>
