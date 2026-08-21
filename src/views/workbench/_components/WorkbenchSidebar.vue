<script setup lang="ts">
import { Histogram, UploadFilled } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElInput, ElOption, ElSelect } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, useTemplateRef } from 'vue'
import { useWorkbenchStore } from '../../../stores/workbench'
import {
  categoryUnavailableReason,
  LIMITS,
  valueUnavailableReason,
  type FieldId,
} from '../utils'
import ValueFieldOrderList from './ValueFieldOrderList.vue'

const store = useWorkbenchStore()
const {
  dataSource,
  worksheets,
  selectedWorksheet: worksheet,
  selectedWorksheetId: worksheetId,
  categoryFieldId,
  valueFields,
  title,
  isParsing,
  controlsDisabled,
} = storeToRefs(store)

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const fileMeta = computed(() => {
  if (!dataSource.value) return ''
  const size = dataSource.value.fileSize < 1024 * 1024
    ? `${Math.max(1, Math.round(dataSource.value.fileSize / 1024))} KB`
    : `${(dataSource.value.fileSize / 1024 / 1024).toFixed(1)} MB`
  return `${size} · 本地文件`
})
const valueFieldIds = computed(() => valueFields.value.map((field) => field.fieldId))
const valueLimitReached = computed(() => valueFieldIds.value.length >= LIMITS.chartValueFields)
const orderedValueFields = computed(() => valueFields.value.flatMap((selection) => {
  const field = worksheet.value?.fields.find((item) => item.id === selection.fieldId)
  return field ? [{ id: field.id, label: field.label, color: selection.color }] : []
}))

function valueOptionReason(fieldId: FieldId) {
  const field = worksheet.value?.fields.find((item) => item.id === fieldId)
  if (!field) return '字段不可用'
  const unavailable = valueUnavailableReason(field, categoryFieldId.value)
  if (unavailable) return unavailable
  if (valueLimitReached.value && !valueFieldIds.value.includes(fieldId)) {
    return `最多选择 ${LIMITS.chartValueFields} 个数值字段`
  }
  return null
}

function chooseFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) store.importFile(file)
}

function removeValueField(id: FieldId) {
  store.selectValueFields(valueFieldIds.value.filter((fieldId) => fieldId !== id))
}
</script>

<template>
  <aside class="h-[42vh] w-full flex flex-none flex-col overflow-auto border-b border-base bg-base px-5 pb-4.5 pt-5.5 sm:h-screen sm:w-100 sm:border-b-0 sm:border-r" aria-label="工作台控制">
    <div class="min-h-8.5 flex items-center gap-2.5 text-[15px] text-text-strong">
      <span class="h-8 w-8 grid place-items-center rounded-1.5 bg-primary text-white" aria-hidden="true"><ElIcon><Histogram /></ElIcon></span>
      <strong>Quick Paint</strong>
    </div>

    <div class="mt-7.5 flex flex-col gap-3">
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept=".xlsx,.csv"
        tabindex="-1"
        aria-hidden="true"
        @change="onFileChange"
      >
      <ElButton class="w-full" :loading="isParsing" @click="chooseFile">
        <ElIcon v-if="!isParsing"><UploadFilled /></ElIcon>
        {{ dataSource ? '更换文件' : '导入文件' }}
      </ElButton>
      <div v-if="dataSource" class="min-w-0 flex flex-col">
        <strong class="overflow-hidden text-xs text-text-strong whitespace-nowrap text-ellipsis" :title="dataSource.fileName">{{ dataSource.fileName }}</strong>
        <span class="text-caption">{{ fileMeta }}</span>
      </div>
    </div>

    <div class="mt-6 flex flex-col gap-2 border-t border-base pt-5" :aria-disabled="controlsDisabled">
      <label class="control-label" for="worksheet">工作表</label>
      <ElSelect
        id="worksheet"
        :model-value="worksheetId"
        :disabled="controlsDisabled"
        aria-label="工作表"
        @change="store.selectWorksheet($event as string)"
      >
        <ElOption
          v-for="item in worksheets"
          :key="item.id"
          :label="item.name"
          :value="item.id"
          :disabled="!item.valid"
        >
          <span :title="item.error ?? item.name">{{ item.name }}</span>
        </ElOption>
      </ElSelect>
      <p v-if="worksheet?.warnings.length" class="m-0 text-[11px] leading-[1.45] text-warning" role="status">
        {{ worksheet.warnings[0]?.message }}
      </p>
      <p v-if="worksheets.some((item) => !item.valid)" class="m-0 text-[11px] leading-[1.45] text-warning" role="status">
        {{ worksheets.filter((item) => !item.valid).length }} 个工作表不可用
      </p>

      <label class="control-label" for="category-field">分类字段</label>
      <ElSelect
        id="category-field"
        :model-value="categoryFieldId"
        :disabled="controlsDisabled"
        clearable
        placeholder="请选择"
        aria-label="分类字段"
        @change="store.selectCategoryField(($event as FieldId | undefined) ?? null)"
      >
        <ElOption
          v-for="field in worksheet?.fields ?? []"
          :key="field.id"
          :label="field.label"
          :value="field.id"
          :disabled="Boolean(categoryUnavailableReason(field, valueFieldIds))"
        >
          <span :title="categoryUnavailableReason(field, valueFieldIds) ?? field.label">{{ field.label }}</span>
        </ElOption>
      </ElSelect>

      <label class="control-label" for="value-fields">数值字段</label>
      <ElSelect
        id="value-fields"
        :model-value="valueFieldIds"
        :disabled="controlsDisabled || categoryFieldId === null"
        :multiple-limit="LIMITS.chartValueFields"
        multiple
        clearable
        placeholder="请选择"
        aria-label="数值字段"
        @change="store.selectValueFields($event as FieldId[])"
      >
        <template #tag>
          <span v-if="valueFieldIds.length" class="text-xs text-text">
            已选择 {{ valueFieldIds.length }}/{{ LIMITS.chartValueFields }} 个字段
          </span>
        </template>
        <ElOption
          v-for="field in worksheet?.fields ?? []"
          :key="field.id"
          :label="field.label"
          :value="field.id"
          :disabled="Boolean(valueOptionReason(field.id))"
        >
          <span :title="valueOptionReason(field.id) ?? field.label">{{ field.label }}</span>
        </ElOption>
      </ElSelect>
      <ValueFieldOrderList
        :fields="orderedValueFields"
        :disabled="controlsDisabled"
        @reorder="store.reorderValueFields($event)"
        @remove="removeValueField"
      />

      <label class="control-label" for="chart-title">图表标题</label>
      <ElInput
        id="chart-title"
        :model-value="title"
        :disabled="controlsDisabled"
        maxlength="120"
        aria-label="图表标题"
        @input="store.updateTitle($event)"
      />
    </div>

  </aside>
</template>
