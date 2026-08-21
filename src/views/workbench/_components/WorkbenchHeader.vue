<script setup lang="ts">
import { Download, RefreshLeft, Setting } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElSegmented, ElTooltip } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useWorkbenchStore } from '../../../stores/workbench'
import type { ViewMode } from '../utils'

const store = useWorkbenchStore()
const emit = defineEmits<{
  resetViewport: []
  openSettings: [trigger: HTMLElement]
}>()
const {
  chart,
  viewMode,
  controlsDisabled,
  exportDisabled,
  isExporting,
  exportError,
  exportSuccess,
} = storeToRefs(store)

const viewOptions = [
  { label: '图表', value: 'chart' },
  { label: '表格', value: 'table' },
]

function openSettings(event: MouseEvent) {
  emit('openSettings', event.currentTarget as HTMLElement)
}
</script>

<template>
  <header class="h-15 min-w-0 flex flex-none items-center justify-between gap-2 border-b border-base bg-base px-3 sm:gap-3 sm:px-5" aria-label="工作台操作">
    <ElTooltip content="复位面板" placement="bottom">
      <ElButton
        circle
        aria-label="复位面板"
        :disabled="viewMode !== 'chart' || !chart"
        @click="emit('resetViewport')"
      >
        <ElIcon><RefreshLeft /></ElIcon>
      </ElButton>
    </ElTooltip>
    <div class="min-w-0 flex items-center justify-end gap-1.5 sm:gap-3">
      <p v-if="exportSuccess" class="m-0 hidden text-xs text-success lg:block" role="status">PNG 已开始下载</p>
      <p v-if="exportError" class="m-0 hidden max-w-72 truncate text-xs text-danger lg:block" :title="exportError" role="alert">{{ exportError }}</p>
      <ElButton class="flex-none xl:hidden" circle aria-label="打开高级设置" @click="openSettings">
        <ElIcon><Setting /></ElIcon>
      </ElButton>
      <ElSegmented
        class="w-28 flex-none sm:w-38"
        :model-value="viewMode"
        :options="viewOptions"
        :disabled="controlsDisabled"
        aria-label="切换视图"
        @change="store.changeView($event as ViewMode)"
      />
      <ElButton
        class="flex-none"
        type="primary"
        aria-label="导出 PNG"
        :disabled="exportDisabled"
        :loading="isExporting"
        @click="store.exportChart"
      >
        <ElIcon v-if="!isExporting"><Download /></ElIcon>
        <span class="hidden sm:inline">导出 PNG</span>
      </ElButton>
    </div>
  </header>
</template>
