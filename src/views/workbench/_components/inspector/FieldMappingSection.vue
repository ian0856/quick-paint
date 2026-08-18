<script setup lang="ts">
import { CircleCheck } from '@element-plus/icons-vue'
import { ElAlert, ElIcon, ElOption, ElSelect } from 'element-plus'
import { computed } from 'vue'
import {
  categoryFieldUnavailableReason,
  valueFieldUnavailableReason,
} from '../../chartComposition'
import type {
  CompositionDiagnostic,
  FieldId,
  WorksheetField,
} from '../../chartComposition'
import type { ChartType } from '../../workbenchModel'

const props = defineProps<{
  chartType: ChartType | null
  fields: WorksheetField[]
  categoryFieldId: FieldId | null
  valueFieldId: FieldId | null
  diagnostics: CompositionDiagnostic[]
  ready: boolean
}>()

const emit = defineEmits<{
  updateCategory: [value: FieldId | null]
  updateValue: [value: FieldId | null]
}>()

const categoryModel = computed({
  get: () => props.categoryFieldId,
  set: (value: FieldId | null) => emit('updateCategory', value),
})

const valueModel = computed({
  get: () => props.valueFieldId,
  set: (value: FieldId | null) => emit('updateValue', value),
})

const categoryDiagnostics = computed(() =>
  props.diagnostics.filter((diagnostic) => diagnostic.role === 'category'),
)
const valueDiagnostics = computed(() =>
  props.diagnostics.filter((diagnostic) => diagnostic.role === 'value'),
)

const kindLabels: Record<WorksheetField['kind'], string> = {
  text: '文本',
  number: '数字',
  date: '日期',
  boolean: '布尔',
  mixed: '混合',
}

function fieldLabel(field: WorksheetField, unavailableReason: string | null) {
  const availability = unavailableReason ? ` · 不可用：${unavailableReason}` : ''
  return `${field.name}（${field.sourceColumn} 列） · ${kindLabels[field.kind]} · ${field.profile.summary}${availability}`
}

function categoryUnavailableReason(field: WorksheetField) {
  return categoryFieldUnavailableReason(field, props.valueFieldId)
}

function valueUnavailableReason(field: WorksheetField) {
  return valueFieldUnavailableReason(field, props.categoryFieldId)
}
</script>

<template>
  <section class="inspector-section">
    <h2 class="section-title"><span class="section-number">02</span>字段映射</h2>
    <ElAlert
      v-if="chartType === null"
      title="请先选择图表类型"
      type="warning"
      :closable="false"
      show-icon
    />
    <ElAlert
      v-else-if="chartType !== 'bar'"
      title="当前切片仅支持柱状图预览"
      type="info"
      :closable="false"
      show-icon
    />
    <template v-else>
    <div class="control-group">
      <label class="control-label">
        类别 <em class="required-mark">必填</em>
      </label>
      <ElSelect v-model="categoryModel" clearable aria-label="类别">
        <ElOption
          v-for="field in fields"
          :key="field.id"
          :label="fieldLabel(field, categoryUnavailableReason(field))"
          :value="field.id"
          :disabled="categoryUnavailableReason(field) !== null"
        />
      </ElSelect>
      <p
        v-for="diagnostic in categoryDiagnostics"
        :key="diagnostic.code"
        class="role-diagnostic"
      >
        {{ diagnostic.message }}
      </p>
    </div>
    <div class="control-group">
      <label class="control-label">
        数值 <em class="required-mark">必填</em>
      </label>
      <ElSelect v-model="valueModel" clearable aria-label="数值">
        <ElOption
          v-for="field in fields"
          :key="field.id"
          :label="fieldLabel(field, valueUnavailableReason(field))"
          :value="field.id"
          :disabled="valueUnavailableReason(field) !== null"
        />
      </ElSelect>
      <p v-if="valueFieldId === null" class="field-guidance">
        仅可选择所有非缺失值均为数值的 Field。
      </p>
      <p
        v-for="diagnostic in valueDiagnostics"
        :key="diagnostic.code"
        class="role-diagnostic"
        :class="{ 'is-warning': diagnostic.severity === 'warning' }"
      >
        {{ diagnostic.message }}
      </p>
    </div>
    <div v-if="ready" class="mapping-ok">
      <ElIcon><CircleCheck /></ElIcon>
      映射有效 · 1 个 Series
    </div>
    </template>
  </section>
</template>

<style scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
}

.required-mark {
  margin-left: 5px;
  color: #c34655;
  font-size: 9px;
  font-style: normal;
  font-weight: 500;
}

.field-guidance,
.role-diagnostic {
  margin: 0;
  font-size: 9px;
  line-height: 1.45;
}

.field-guidance {
  color: var(--text-muted);
}

.role-diagnostic {
  color: #b42318;
}

.role-diagnostic.is-warning {
  color: #94620a;
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
</style>
