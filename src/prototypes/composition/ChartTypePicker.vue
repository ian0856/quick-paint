<script setup lang="ts">
import { Histogram, PieChart, TrendCharts } from '@element-plus/icons-vue'
import type { ChartType } from '../workbench/prototypeState'
import { compositionState, setChartType } from '../workbench/prototypeState'

function choose(value: string | number | boolean | undefined) {
  setChartType(value as ChartType)
}
</script>

<template>
  <el-radio-group :model-value="compositionState.chartType" class="chart-type-picker" @update:model-value="choose">
    <el-radio-button value="bar"><el-icon><Histogram /></el-icon><span>柱状图</span></el-radio-button>
    <el-radio-button value="line"><el-icon><TrendCharts /></el-icon><span>折线图</span></el-radio-button>
    <el-radio-button value="pie"><el-icon><PieChart /></el-icon><span>饼图</span></el-radio-button>
    <el-radio-button value="scatter"><el-icon><TrendCharts /></el-icon><span>散点图</span></el-radio-button>
  </el-radio-group>
</template>
