<script setup lang="ts">
import { CircleCheck, Warning } from '@element-plus/icons-vue'
import { ElAlert, ElIcon, ElOption, ElSelect } from 'element-plus'
import { computed } from 'vue'
import type { ChartType } from '../../workbenchModel'
import { fieldOptions } from '../inspectorOptions'

const props = defineProps<{
  chartType: ChartType
  categoryField: string
  seriesFields: string[]
  ready: boolean
}>()

const emit = defineEmits<{
  updateCategory: [value: string]
  updateSeries: [value: string[]]
}>()

const mappingRoles = computed(() => {
  if (props.chartType === 'pie') return { primary: '名称', series: '数值', multiple: false }
  if (props.chartType === 'scatter') return { primary: 'X 轴', series: 'Y 轴', multiple: true }
  return { primary: '类别', series: '数值系列', multiple: true }
})

const categoryModel = computed({
  get: () => props.categoryField,
  set: (value: string) => emit('updateCategory', value),
})

const seriesModel = computed({
  get: () => props.seriesFields,
  set: (value: string[]) => emit('updateSeries', value),
})

const singleSeriesModel = computed({
  get: () => props.seriesFields[0] ?? '',
  set: (value: string) => emit('updateSeries', value ? [value] : []),
})

const mappingWarning = computed(() =>
  props.seriesFields.includes('west') ? '“华西”有 1 个缺失值，将保留类别位置。' : '',
)

function primaryFieldDisabled(field: (typeof fieldOptions)[number]) {
  if (props.seriesFields.includes(field.value)) return true
  return props.chartType === 'scatter' && !field.numeric
}
</script>

<template>
  <section class="inspector-section">
    <h2 class="section-title"><span class="section-number">02</span>字段映射</h2>
    <div class="control-group">
      <label class="control-label">
        {{ mappingRoles.primary }} <em class="required-mark">必填</em>
      </label>
      <ElSelect v-model="categoryModel" clearable :aria-label="mappingRoles.primary">
        <ElOption
          v-for="field in fieldOptions"
          :key="field.value"
          :label="`${field.label} · ${field.kind} · ${field.detail}`"
          :value="field.value"
          :disabled="primaryFieldDisabled(field)"
        />
      </ElSelect>
    </div>
    <div class="control-group">
      <label class="control-label">
        {{ mappingRoles.series }} <em class="required-mark">必填</em>
        <small v-if="mappingRoles.multiple" class="control-hint">最多 8 个</small>
      </label>
      <ElSelect
        v-if="mappingRoles.multiple"
        v-model="seriesModel"
        multiple
        :multiple-limit="8"
        collapse-tags
        :max-collapse-tags="2"
        clearable
        :aria-label="mappingRoles.series"
      >
        <ElOption
          v-for="field in fieldOptions"
          :key="field.value"
          :label="`${field.label} · ${field.kind} · ${field.detail}`"
          :value="field.value"
          :disabled="!field.numeric || field.value === categoryField"
        />
      </ElSelect>
      <ElSelect v-else v-model="singleSeriesModel" clearable :aria-label="mappingRoles.series">
        <ElOption
          v-for="field in fieldOptions"
          :key="field.value"
          :label="`${field.label} · ${field.kind} · ${field.detail}`"
          :value="field.value"
          :disabled="!field.numeric || field.value === categoryField"
        />
      </ElSelect>
    </div>
    <ElAlert
      v-if="mappingWarning"
      :icon="Warning"
      :title="mappingWarning"
      type="warning"
      :closable="false"
      show-icon
    />
    <div v-else-if="ready" class="mapping-ok">
      <ElIcon><CircleCheck /></ElIcon>
      映射有效 · {{ seriesFields.length }} 个 Series
    </div>
    <ElAlert
      v-else
      title="请选择所有必填 Mapping Role"
      type="warning"
      :closable="false"
      show-icon
    />
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

.control-hint {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 400;
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
