<script setup lang="ts">
import { Download, RefreshLeft } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElSegmented, ElTooltip } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useWorkbenchStore } from '../../../stores/workbench'
import type { ViewMode } from '../utils'

const store = useWorkbenchStore()
const emit = defineEmits<{ resetViewport: [] }>()
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
</script>

<template>
  <header class="h-15 min-w-0 flex flex-none items-center justify-between gap-3 border-b border-base bg-base px-5" aria-label="工作台操作">
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
    <div class="min-w-0 flex items-center justify-end gap-3">
      <p v-if="exportSuccess" class="m-0 text-xs text-success" role="status">PNG 已开始下载</p>
      <p v-if="exportError" class="m-0 max-w-72 truncate text-xs text-danger" :title="exportError" role="alert">{{ exportError }}</p>
      <ElSegmented
        class="w-38 flex-none"
        :model-value="viewMode"
        :options="viewOptions"
        :disabled="controlsDisabled"
        aria-label="切换视图"
        @change="store.changeView($event as ViewMode)"
      />
      <ElButton
        class="flex-none"
        type="primary"
        :disabled="exportDisabled"
        :loading="isExporting"
        @click="store.exportChart"
      >
        <ElIcon v-if="!isExporting"><Download /></ElIcon>
        导出 PNG
      </ElButton>
    </div>
  </header>
</template>
