<script setup lang="ts">
import {
  CircleCheck,
  DataAnalysis,
  Histogram,
  PieChart,
  TrendCharts,
  Warning,
} from '@element-plus/icons-vue'
import {
  ElAlert,
  ElCheckbox,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTag,
} from 'element-plus'
import { computed, reactive } from 'vue'

type ChartType = 'bar' | 'line' | 'pie' | 'scatter'

const chartTypes = [
  { value: 'bar', label: '柱状图', icon: Histogram },
  { value: 'line', label: '折线图', icon: TrendCharts },
  { value: 'pie', label: '饼图', icon: PieChart },
  { value: 'scatter', label: '散点图', icon: DataAnalysis },
] as const

const fields = [
  { value: 'month', label: '月份', kind: '文本', detail: '6 个文本 · 无缺失', numeric: false },
  { value: 'east', label: '华东', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'south', label: '华南', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'west', label: '华西', kind: '数字', detail: '5 个数字 · 1 个缺失', numeric: true },
  { value: 'north', label: '华北', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  {
    value: 'reportedAt',
    label: '填报日期',
    kind: '日期',
    detail: '不能用于数值角色',
    numeric: false,
  },
  { value: 'note', label: '备注', kind: '混合', detail: '含文本 · 不能用于数值角色', numeric: false },
] as const

const form = reactive({
  chartType: 'bar' as ChartType,
  categoryField: 'month',
  seriesFields: ['east', 'south'],
  title: '2026 上半年区域销售',
  selectedColor: '#2f6fed',
  showLegend: true,
  showDataLabels: false,
  width: 1600,
  height: 900,
})

const palette = ['#2f6fed', '#22a06b', '#f0a128', '#d64f64'] as const

const mappingRoles = computed(() => {
  if (form.chartType === 'pie') return { primary: '名称', series: '数值', multiple: false }
  if (form.chartType === 'scatter') return { primary: 'X 轴', series: 'Y 轴', multiple: true }
  return { primary: '类别', series: '数值系列', multiple: true }
})

const mappingValid = computed(
  () => form.categoryField.length > 0 && form.seriesFields.length > 0,
)
const mappingWarning = computed(() =>
  form.seriesFields.includes('west') ? '“华西”有 1 个缺失值，将保留类别位置。' : '',
)

function chooseColor(color: (typeof palette)[number]) {
  form.selectedColor = color
}
</script>

<template>
  <aside class="inspector" aria-label="Chart Composition">
    <div class="inspector-heading">
      <div>
        <strong>Chart Composition</strong>
        <small>分组检查器</small>
      </div>
      <el-tag :type="mappingValid ? 'success' : 'warning'" size="small" effect="light">
        {{ mappingValid ? '有效' : '未完成' }}
      </el-tag>
    </div>

    <div class="inspector-scroll">
      <section class="inspector-section">
        <h2><span>01</span>图表类型</h2>
        <el-radio-group v-model="form.chartType" class="chart-types" aria-label="图表类型">
          <el-radio-button v-for="item in chartTypes" :key="item.value" :value="item.value">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-radio-button>
        </el-radio-group>
      </section>

      <section class="inspector-section">
        <h2><span>02</span>字段映射</h2>
        <div class="control-group">
          <label>{{ mappingRoles.primary }} <em>必填</em></label>
          <el-select v-model="form.categoryField" clearable :aria-label="mappingRoles.primary">
            <el-option
              v-for="field in fields"
              :key="field.value"
              :label="`${field.label} · ${field.kind} · ${field.detail}`"
              :value="field.value"
              :disabled="form.seriesFields.includes(field.value)"
            />
          </el-select>
        </div>
        <div class="control-group">
          <label>
            {{ mappingRoles.series }} <em>必填</em>
            <small v-if="mappingRoles.multiple">最多 8 个</small>
          </label>
          <el-select
            v-model="form.seriesFields"
            multiple
            collapse-tags
            :max-collapse-tags="2"
            clearable
            :aria-label="mappingRoles.series"
          >
            <el-option
              v-for="field in fields"
              :key="field.value"
              :label="`${field.label} · ${field.kind} · ${field.numeric ? field.detail : field.detail}`"
              :value="field.value"
              :disabled="!field.numeric || field.value === form.categoryField"
            />
          </el-select>
        </div>
        <el-alert
          v-if="mappingWarning"
          :icon="Warning"
          :title="mappingWarning"
          type="warning"
          :closable="false"
          show-icon
        />
        <div v-else-if="mappingValid" class="mapping-ok">
          <el-icon><CircleCheck /></el-icon>
          映射有效 · {{ form.seriesFields.length }} 个 Series
        </div>
        <el-alert
          v-else
          title="请选择所有必填 Mapping Role"
          type="warning"
          :closable="false"
          show-icon
        />
      </section>

      <section class="inspector-section">
        <h2><span>03</span>外观</h2>
        <div class="control-group">
          <label>标题</label>
          <el-input v-model="form.title" maxlength="60" show-word-limit />
        </div>
        <div class="appearance-row">
          <div>
            <label>Series 配色</label>
            <div class="swatches">
              <button
                v-for="color in palette"
                :key="color"
                type="button"
                :class="{ 'is-selected': form.selectedColor === color }"
                :style="{ backgroundColor: color }"
                :aria-label="`选择颜色 ${color}`"
                :aria-pressed="form.selectedColor === color"
                @click="chooseColor(color)"
              />
            </div>
          </div>
          <div class="toggles">
            <el-checkbox v-model="form.showLegend">图例</el-checkbox>
            <el-checkbox v-model="form.showDataLabels">数据标签</el-checkbox>
          </div>
        </div>
      </section>

      <section class="inspector-section">
        <h2><span>04</span>Chart Image</h2>
        <div class="size-row">
          <el-input-number v-model="form.width" :step="100" controls-position="right" aria-label="宽度" />
          <span>×</span>
          <el-input-number v-model="form.height" :step="100" controls-position="right" aria-label="高度" />
          <small>px</small>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  min-width: 0;
  border-left: 1px solid var(--border);
  background: var(--surface);
}

.inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  box-sizing: border-box;
}

.inspector-heading > div {
  display: flex;
  flex-direction: column;
}

.inspector-heading strong {
  color: var(--text-strong);
  font-size: 12px;
}

.inspector-heading small {
  color: var(--text-muted);
  font-size: 9px;
}

.inspector-scroll {
  height: calc(100vh - 108px);
  overflow: auto;
}

.inspector-section {
  padding: 17px 16px 18px;
  border-bottom: 1px solid var(--border);
}

.inspector-section h2 {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 14px;
  color: var(--text-strong);
  font-size: 12px;
  line-height: 1;
}

.inspector-section h2 span {
  color: var(--primary);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

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

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.control-group label,
.appearance-row label {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
}

.control-group label {
  display: flex;
  align-items: center;
}

.control-group em {
  margin-left: 5px;
  color: #c34655;
  font-size: 9px;
  font-style: normal;
  font-weight: 500;
}

.control-group small {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 400;
}

.control-group :deep(.el-select),
.control-group :deep(.el-input) {
  width: 100%;
}

.mapping-ok {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 9px;
  border-radius: 5px;
  color: #18724d;
  background: #eaf8f1;
  font-size: 10px;
  font-weight: 600;
}

.appearance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
}

.swatches {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.swatches button {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid var(--surface);
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--border-strong);
  cursor: pointer;
}

.swatches button.is-selected {
  box-shadow: 0 0 0 2px var(--primary);
}

.swatches button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

.toggles {
  display: flex;
  flex-direction: column;
}

.toggles :deep(.el-checkbox) {
  height: 23px;
  margin-right: 0;
}

.size-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
}

.size-row :deep(.el-input-number) {
  width: 100%;
}

.size-row > span,
.size-row > small {
  color: var(--text-muted);
  font-size: 10px;
}
</style>
