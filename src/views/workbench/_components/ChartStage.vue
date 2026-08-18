<script setup lang="ts">
import { ElSegmented, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { computed, shallowRef } from 'vue'

type ViewMode = 'chart' | 'data'

const viewMode = shallowRef<ViewMode>('chart')
const viewOptions = [
  { label: '图表预览', value: 'chart' },
  { label: '数据预览', value: 'data' },
]

const records = [
  { month: '一月', east: 86, south: 62 },
  { month: '二月', east: 104, south: 75 },
  { month: '三月', east: 98, south: 81 },
  { month: '四月', east: 126, south: 90 },
  { month: '五月', east: 142, south: 96 },
  { month: '六月', east: 158, south: 112 },
]

const maxValue = 180
const chartRecords = computed(() =>
  records.map((record) => ({
    ...record,
    eastHeight: `${(record.east / maxValue) * 100}%`,
    southHeight: `${(record.south / maxValue) * 100}%`,
  })),
)
</script>

<template>
  <section class="chart-stage" aria-label="工作区预览">
    <div class="stage-toolbar">
      <el-segmented v-model="viewMode" :options="viewOptions" aria-label="预览方式" />
      <span class="image-size">1600 × 900 px</span>
    </div>

    <div class="stage-content">
      <article v-show="viewMode === 'chart'" class="chart-paper">
        <header class="chart-heading">
          <div>
            <h1>2026 上半年区域销售</h1>
            <p>单位：万元</p>
          </div>
          <div class="legend" aria-label="Series 图例">
            <span><i class="legend-east" />华东</span>
            <span><i class="legend-south" />华南</span>
          </div>
        </header>

        <div class="chart-body" role="img" aria-label="柱状图，展示一月至六月的华东和华南销售额">
          <div class="y-axis" aria-hidden="true">
            <span>180</span>
            <span>120</span>
            <span>60</span>
            <span>0</span>
          </div>
          <div class="plot">
            <div class="grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            <div class="bar-slots">
              <div v-for="record in chartRecords" :key="record.month" class="bar-slot">
                <div class="bar-group">
                  <i class="bar bar--east" :style="{ height: record.eastHeight }" />
                  <i class="bar bar--south" :style="{ height: record.southHeight }" />
                </div>
                <span>{{ record.month }}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article v-show="viewMode === 'data'" class="data-paper">
        <header class="data-heading">
          <div>
            <h1>区域销售</h1>
            <p>6 条 Record · 3 个可见 Field</p>
          </div>
          <el-tag type="success" effect="light">Worksheet Interpretation</el-tag>
        </header>
        <el-table :data="records" height="100%" stripe>
          <el-table-column prop="month" label="月份" />
          <el-table-column prop="east" label="华东" align="right" />
          <el-table-column prop="south" label="华南" align="right" />
        </el-table>
      </article>
    </div>
  </section>
</template>

<style scoped>
.chart-stage {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  min-width: 0;
  background: #f3f5f8;
}

.stage-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.stage-toolbar :deep(.el-segmented) {
  --el-segmented-item-selected-bg-color: var(--surface);
  --el-segmented-item-selected-color: var(--primary);
}

.image-size {
  color: var(--text-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.stage-content {
  min-height: 0;
  padding: 28px;
  overflow: auto;
}

.chart-paper,
.data-paper {
  height: 100%;
  min-height: 430px;
  padding: 30px 34px;
  border: 1px solid #e1e5eb;
  border-radius: 6px;
  background: var(--surface);
  box-shadow: 0 8px 24px rgb(26 38 60 / 6%);
  box-sizing: border-box;
}

.chart-paper {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 26px;
}

.chart-heading,
.data-heading,
.legend,
.legend span {
  display: flex;
  align-items: center;
}

.chart-heading,
.data-heading {
  justify-content: space-between;
}

.chart-heading h1,
.data-heading h1 {
  margin: 0 0 5px;
  color: var(--text-strong);
  font-size: 20px;
  line-height: 1.25;
}

.chart-heading p,
.data-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
}

.legend {
  gap: 16px;
  color: var(--text-muted);
  font-size: 11px;
}

.legend span {
  gap: 6px;
}

.legend i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

.legend-east,
.bar--east {
  background: #2f6fed;
}

.legend-south,
.bar--south {
  background: #22a06b;
}

.chart-body {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  min-height: 0;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 25px);
  padding-right: 8px;
  color: #929aa8;
  font-size: 9px;
  text-align: right;
}

.plot {
  position: relative;
  min-height: 0;
}

.grid-lines {
  position: absolute;
  inset: 0 0 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-lines i {
  width: 100%;
  border-top: 1px solid #e9ecf1;
}

.bar-slots {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(6, minmax(42px, 1fr));
  gap: 10px;
}

.bar-slot {
  display: grid;
  grid-template-rows: minmax(0, 1fr) 25px;
  min-width: 0;
}

.bar-group {
  display: flex;
  gap: 5px;
  align-items: end;
  justify-content: center;
  min-height: 0;
}

.bar {
  display: block;
  width: min(30%, 28px);
  min-height: 2px;
  border-radius: 3px 3px 0 0;
}

.bar-slot > span {
  align-self: end;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 10px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-paper {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
}
</style>
