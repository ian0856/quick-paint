<script setup lang="ts">
import { DataAnalysis, Histogram, PieChart, TrendCharts } from '@element-plus/icons-vue'
import { ElIcon, ElRadioButton, ElRadioGroup } from 'element-plus'
import type { ChartType } from '../../workbenchModel'

defineProps<{ chartType: ChartType }>()

const emit = defineEmits<{ change: [chartType: ChartType] }>()

const chartTypes = [
  { value: 'bar', label: '柱状图', icon: Histogram },
  { value: 'line', label: '折线图', icon: TrendCharts },
  { value: 'pie', label: '饼图', icon: PieChart },
  { value: 'scatter', label: '散点图', icon: DataAnalysis },
] as const
</script>

<template>
  <section class="inspector-section">
    <h2 class="section-title"><span class="section-number">01</span>图表类型</h2>
    <ElRadioGroup
      :model-value="chartType"
      class="chart-types"
      aria-label="图表类型"
      @update:model-value="emit('change', $event as ChartType)"
    >
      <ElRadioButton v-for="item in chartTypes" :key="item.value" :value="item.value">
        <ElIcon><component :is="item.icon" /></ElIcon>
        <span class="chart-type-label">{{ item.label }}</span>
      </ElRadioButton>
    </ElRadioGroup>
  </section>
</template>

<style scoped>
.chart-types {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
}

.chart-types :deep(.el-radio-button) {
  min-width: 0;
}

.chart-types :deep(.el-radio-button__inner) {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  padding: 8px 3px;
  font-size: 9px;
}

.chart-types :deep(.el-icon) {
  font-size: 13px;
}
</style>
