<script setup lang="ts">
import { computed } from 'vue'
import { compositionState, selectedFieldLabel, worksheetRows } from './prototypeState'

const max = Math.max(...worksheetRows.map((row) => row.east))
const points = computed(() => worksheetRows.map((row, index) => ({
  x: 9 + index * 16.4,
  y: 83 - (Number(row[compositionState.valueField as keyof typeof row]) / max) * 63,
})))
const linePoints = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '))
</script>

<template>
  <section class="chart-paper">
    <div class="chart-paper-heading">
      <div>
        <h2>{{ compositionState.title || '未命名图表' }}</h2>
        <p>单位：万元</p>
      </div>
      <span v-if="compositionState.showLegend" class="chart-legend">
        <i :style="{ background: compositionState.color }" />{{ selectedFieldLabel }}
      </span>
    </div>

    <div v-if="compositionState.chartType === 'bar'" class="bar-chart">
      <div v-for="row in worksheetRows" :key="row.month" class="bar-slot">
        <div class="bar-value">{{ row[compositionState.valueField as keyof typeof row] }}</div>
        <div class="bar" :style="{ height: `${Number(row[compositionState.valueField as keyof typeof row]) / max * 82}%`, background: compositionState.color }" />
        <span>{{ row.month }}</span>
      </div>
    </div>

    <svg v-else-if="compositionState.chartType === 'line'" class="line-chart" viewBox="0 0 100 92" preserveAspectRatio="none">
      <g class="grid-lines"><line v-for="y in [20, 40, 60, 80]" :key="y" x1="6" :y1="y" x2="96" :y2="y" /></g>
      <polyline :points="linePoints" fill="none" :stroke="compositionState.color" stroke-width="2" vector-effect="non-scaling-stroke" />
      <circle v-for="point in points" :key="point.x" :cx="point.x" :cy="point.y" r="1.4" :fill="compositionState.color" />
    </svg>

    <div v-else-if="compositionState.chartType === 'pie'" class="pie-wrap">
      <div class="pie" :style="{ '--chart-color': compositionState.color }" />
      <div class="pie-labels"><span>华东 38%</span><span>华南 27%</span><span>华北 22%</span><span>华西 13%</span></div>
    </div>

    <div v-else class="scatter-chart">
      <span v-for="(point, index) in points" :key="point.x" :style="{ left: `${point.x}%`, bottom: `${92 - point.y}%`, background: compositionState.color, width: `${10 + index}px`, height: `${10 + index}px` }" />
    </div>
  </section>
</template>
