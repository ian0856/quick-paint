<script setup lang="ts">
import { ElSegmented, ElTag } from 'element-plus'
import { computed, shallowRef } from 'vue'
import type { ChartCompositionResult, SourceValue, WorksheetInterpretation } from '../chartComposition'
import type { WorkbenchComposition } from '../workbenchModel'

type ViewMode = 'chart' | 'data'

const props = defineProps<{
  worksheet: WorksheetInterpretation
  composition: WorkbenchComposition
  result: ChartCompositionResult
}>()

const viewMode = shallowRef<ViewMode>('chart')
const viewOptions = [
  { label: '图表预览', value: 'chart' },
  { label: '数据预览', value: 'data' },
]
const axisNumberFormat = new Intl.NumberFormat('zh-CN', {
  maximumSignificantDigits: 4,
  useGrouping: false,
})

const chart = computed(() => props.result.chart)
const axis = computed(() => {
  const values = chart.value?.series.flatMap((series) => series.values) ?? []
  const numericValues = values.filter((value): value is number => value !== null)
  const minimum = Math.min(0, ...numericValues)
  const maximum = Math.max(0, ...numericValues)
  return minimum === maximum
    ? { minimum: 0, maximum: 1, range: 1 }
    : { minimum, maximum, range: maximum - minimum }
})
const axisLabels = computed(() =>
  Array.from({ length: 4 }, (_, index) => ({
    key: index,
    label: formatAxisValue(axis.value.maximum - (axis.value.range * index) / 3),
  })),
)
const zeroLinePosition = computed(() => {
  const ratio = axis.value.maximum / axis.value.range
  return `calc(${ratio * 100}% - ${ratio * 25}px)`
})
const chartRecords = computed(() => {
  if (!chart.value) return []
  const values = chart.value.series[0]?.values ?? []
  return chart.value.categories.map((category, index) => {
    const value = values[index] ?? null
    return {
      key: index,
      category,
      value,
      barStyle: value === null
        ? {}
        : {
            bottom: `${((Math.min(value, 0) - axis.value.minimum) / axis.value.range) * 100}%`,
            height: `${(Math.abs(value) / axis.value.range) * 100}%`,
            backgroundColor: props.composition.selectedColor,
            borderRadius: value < 0 ? '0 0 3px 3px' : '3px 3px 0 0',
          },
    }
  })
})
const chartAriaLabel = computed(() => {
  const seriesName = chart.value?.series[0]?.name ?? ''
  return `柱状图，${seriesName}，共 ${chartRecords.value.length} 个 Record`
})
const emptyCopy = computed(() => {
  if (props.composition.chartType === null) return '请先选择柱状图，再配置所需的 Mapping Role。'
  return props.result.diagnostics.find((diagnostic) => diagnostic.severity === 'error')?.message
    ?? '请修正字段映射后重试。'
})
const tableRows = computed(() =>
  Array.from({ length: props.worksheet.recordCount }, (_, recordIndex) =>
    props.worksheet.fields.map((field) => formatSourceValue(field.values[recordIndex] ?? null)),
  ),
)

function formatSourceValue(value: SourceValue) {
  if (value === null) return '（空白）'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function formatAxisValue(value: number) {
  return axisNumberFormat.format(Math.abs(value) < Number.EPSILON ? 0 : value)
}
</script>

<template>
  <section class="chart-stage" aria-label="工作区预览">
    <div class="stage-toolbar">
      <ElSegmented v-model="viewMode" :options="viewOptions" aria-label="预览方式" />
      <span class="image-size">{{ composition.width }} × {{ composition.height }} px</span>
    </div>

    <div class="stage-content">
      <article v-show="viewMode === 'chart'" class="chart-paper" :class="{ 'is-empty': !chart }">
        <template v-if="chart">
          <header class="chart-heading">
            <div class="chart-title-group">
              <h1 class="chart-title">{{ composition.title || '未命名图表' }}</h1>
              <p class="chart-unit">{{ worksheet.name }} · {{ worksheet.recordCount }} 条 Record</p>
            </div>
            <div v-if="composition.showLegend" class="legend" aria-label="Series 图例">
              <span class="legend-item">
                <i class="legend-swatch" :style="{ backgroundColor: composition.selectedColor }" />
                {{ chart.series[0]?.name }}
              </span>
            </div>
          </header>

          <div class="chart-body" role="img" :aria-label="chartAriaLabel">
            <div class="y-axis" aria-hidden="true">
              <span v-for="axisLabel in axisLabels" :key="axisLabel.key" class="axis-label">
                {{ axisLabel.label }}
              </span>
            </div>
            <div class="plot">
              <div class="grid-lines" aria-hidden="true">
                <i v-for="line in 4" :key="line" class="grid-line" />
              </div>
              <i class="zero-line" :style="{ top: zeroLinePosition }" aria-hidden="true" />
              <div
                class="bar-slots"
                :style="{ gridTemplateColumns: `repeat(${chartRecords.length}, minmax(42px, 1fr))` }"
              >
                <div v-for="record in chartRecords" :key="record.key" class="bar-slot">
                  <div class="bar-group">
                    <span v-if="composition.showDataLabels && record.value !== null" class="data-label">
                      {{ record.value }}
                    </span>
                    <i
                      v-if="record.value !== null"
                      class="bar"
                      :style="record.barStyle"
                    />
                  </div>
                  <span class="bar-label">{{ record.category }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="chart-empty" role="status" aria-live="polite">
          <strong class="empty-title">完成字段映射后显示预览</strong>
          <span class="empty-copy">{{ emptyCopy }}</span>
        </div>
      </article>

      <article v-show="viewMode === 'data'" class="data-paper">
        <header class="data-heading">
          <div class="data-title-group">
            <h1 class="data-title">{{ worksheet.name }}</h1>
            <p class="data-summary">
              {{ worksheet.recordCount }} 条 Record · {{ worksheet.fields.length }} 个 Field
            </p>
          </div>
          <ElTag type="success" effect="light">Worksheet Interpretation</ElTag>
        </header>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="field in worksheet.fields" :key="field.id" scope="col">
                  {{ field.name }}（{{ field.sourceColumn }} 列）
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in tableRows" :key="rowIndex">
                <td v-for="(value, fieldIndex) in row" :key="worksheet.fields[fieldIndex]?.id">
                  {{ value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

.stage-toolbar,
.chart-heading,
.data-heading,
.legend-item {
  display: flex;
  align-items: center;
}

.stage-toolbar,
.chart-heading,
.data-heading {
  justify-content: space-between;
}

.stage-toolbar {
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.image-size,
.chart-unit,
.data-summary {
  color: var(--text-muted);
  font-size: 11px;
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
}

.chart-paper {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 26px;
}

.chart-title,
.data-title {
  margin: 0 0 5px;
  color: var(--text-strong);
  font-size: 20px;
  line-height: 1.25;
}

.chart-unit,
.data-summary {
  margin: 0;
}

.legend-item {
  gap: 6px;
  color: var(--text-muted);
  font-size: 11px;
}

.legend-swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

.chart-body {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
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

.grid-line {
  width: 100%;
  border-top: 1px solid #e9ecf1;
}

.zero-line {
  position: absolute;
  right: 0;
  left: 0;
  border-top: 1px solid #b8c0cc;
}

.bar-slots {
  position: absolute;
  inset: 0;
  display: grid;
  gap: 10px;
}

.bar-slot {
  display: grid;
  grid-template-rows: minmax(0, 1fr) 25px;
  min-width: 0;
}

.bar-group {
  position: relative;
  min-height: 0;
}

.bar {
  position: absolute;
  left: 50%;
  display: block;
  width: min(48%, 34px);
  min-height: 2px;
  transform: translateX(-50%);
}

.data-label {
  position: absolute;
  top: 0;
  color: var(--text-muted);
  font-size: 9px;
}

.bar-label {
  align-self: end;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 10px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-paper.is-empty {
  display: grid;
  place-items: center;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  max-width: 360px;
  color: var(--text-muted);
  text-align: center;
}

.empty-title {
  color: var(--text-strong);
  font-size: 14px;
}

.empty-copy {
  font-size: 11px;
}

.data-paper {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
}

.table-scroll {
  min-height: 0;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  white-space: nowrap;
}

.data-table th,
.data-table td {
  padding: 9px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  position: sticky;
  top: 0;
  color: var(--text-strong);
  background: var(--surface-subtle);
}
</style>
