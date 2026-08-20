<script setup lang="ts">
import { Close, Loading, WarningFilled } from '@element-plus/icons-vue'
import { ElButton, ElIcon } from 'element-plus'
import { computed } from 'vue'
import type {
  BarChartModel,
  ChartResolution,
  DataSourceInterpretation,
  ParseFailure,
  ViewMode,
  WorksheetInterpretation,
} from '../utils'
import BarChartView from './BarChartView.vue'
import SourceTableView from './SourceTableView.vue'

const props = defineProps<{
  dataSource: DataSourceInterpretation | null
  worksheet: WorksheetInterpretation | null
  viewMode: ViewMode
  chartResolution: ChartResolution | null
  chart: BarChartModel | null
  isParsing: boolean
  parseFailure: ParseFailure | null
  replacementFailure: ParseFailure | null
}>()

defineEmits<{ dismissReplacementFailure: [] }>()

const diagnostic = computed(() => {
  const resolution = props.chartResolution
  return resolution && !resolution.valid ? resolution.diagnostic : null
})
</script>

<template>
  <main class="relative h-screen min-h-0 min-w-0 flex-1 bg-secondary">
    <div
      v-if="replacementFailure"
      class="z-alert absolute left-1/2 top-4 min-h-10 w-[calc(100%_-_40px)] max-w-180 flex -translate-x-1/2 items-center gap-2 border border-[#f1b8b8] rounded-1.5 bg-[#fff7f7] py-1.75 pl-3.5 pr-2.25 text-xs text-[#a72e2e] shadow-[0_8px_22px_rgb(60_20_20/9%)]"
      role="alert"
    >
      <ElIcon><WarningFilled /></ElIcon>
      <span>{{ replacementFailure.message }} {{ replacementFailure.recovery }}</span>
      <ElButton text circle aria-label="关闭错误提示" @click="$emit('dismissReplacementFailure')">
        <ElIcon><Close /></ElIcon>
      </ElButton>
    </div>

    <div v-if="isParsing" class="status-center" role="status" aria-live="polite">
      <ElIcon class="animate-spin"><Loading /></ElIcon>
      <strong class="text-sm text-text-strong">正在解析文件</strong>
    </div>
    <div v-else-if="parseFailure && !dataSource" class="status-center text-danger" role="alert">
      <ElIcon><WarningFilled /></ElIcon>
      <strong class="text-sm text-danger">{{ parseFailure.message }}</strong>
      <span class="text-xs">{{ parseFailure.recovery }}</span>
    </div>
    <template v-else-if="worksheet">
      <SourceTableView v-if="viewMode === 'table'" :worksheet="worksheet" />
      <BarChartView v-else-if="chart" :chart="chart" />
      <div v-else class="status-center" role="status">
        <strong class="text-sm text-text-strong">{{ diagnostic?.message }}</strong>
        <span v-if="diagnostic?.code === 'too-many-records'" class="text-xs">
          请更换工作表或导入更小的文件。
        </span>
      </div>
    </template>
  </main>
</template>
