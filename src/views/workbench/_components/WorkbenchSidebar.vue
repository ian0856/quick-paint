<script setup lang="ts">
import { Download, Histogram, UploadFilled } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElInput, ElOption, ElSegmented, ElSelect } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import {
  categoryUnavailableReason,
  valueUnavailableReason,
  type DataSourceInterpretation,
  type FieldId,
  type ViewMode,
  type WorksheetInterpretation,
} from '../utils'

const props = defineProps<{
  dataSource: DataSourceInterpretation | null
  worksheets: WorksheetInterpretation[]
  worksheet: WorksheetInterpretation | null
  worksheetId: string | null
  categoryFieldId: FieldId | null
  valueFieldId: FieldId | null
  title: string
  viewMode: ViewMode
  isParsing: boolean
  controlsDisabled: boolean
  exportDisabled: boolean
  isExporting: boolean
  exportError: string | null
  exportSuccess: boolean
}>()

const emit = defineEmits<{
  importFile: [file: File]
  selectWorksheet: [id: string]
  selectCategoryField: [id: FieldId | null]
  selectValueField: [id: FieldId | null]
  updateTitle: [title: string]
  changeView: [mode: ViewMode]
  exportChart: []
}>()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const viewOptions = [
  { label: '图表', value: 'chart' },
  { label: '表格', value: 'table' },
]
const fileMeta = computed(() => {
  if (!props.dataSource) return ''
  const size = props.dataSource.fileSize < 1024 * 1024
    ? `${Math.max(1, Math.round(props.dataSource.fileSize / 1024))} KB`
    : `${(props.dataSource.fileSize / 1024 / 1024).toFixed(1)} MB`
  return `${size} · 本地文件`
})

function chooseFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('importFile', file)
}
</script>

<template>
  <aside class="h-screen w-70 flex flex-none flex-col overflow-auto border-r border-base bg-base px-5 pb-4.5 pt-5.5" aria-label="工作台控制">
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
        @change="emit('selectWorksheet', $event)"
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
        @change="emit('selectCategoryField', $event ?? null)"
      >
        <ElOption
          v-for="field in worksheet?.fields ?? []"
          :key="field.id"
          :label="field.label"
          :value="field.id"
          :disabled="Boolean(categoryUnavailableReason(field, valueFieldId))"
        >
          <span :title="categoryUnavailableReason(field, valueFieldId) ?? field.label">{{ field.label }}</span>
        </ElOption>
      </ElSelect>

      <label class="control-label" for="value-field">数值字段</label>
      <ElSelect
        id="value-field"
        :model-value="valueFieldId"
        :disabled="controlsDisabled"
        clearable
        placeholder="请选择"
        aria-label="数值字段"
        @change="emit('selectValueField', $event ?? null)"
      >
        <ElOption
          v-for="field in worksheet?.fields ?? []"
          :key="field.id"
          :label="field.label"
          :value="field.id"
          :disabled="Boolean(valueUnavailableReason(field, categoryFieldId))"
        >
          <span :title="valueUnavailableReason(field, categoryFieldId) ?? field.label">{{ field.label }}</span>
        </ElOption>
      </ElSelect>

      <label class="control-label" for="chart-title">图表标题</label>
      <ElInput
        id="chart-title"
        :model-value="title"
        :disabled="controlsDisabled"
        maxlength="120"
        aria-label="图表标题"
        @input="emit('updateTitle', $event)"
      />
    </div>

    <div class="mt-auto flex flex-col gap-3 pt-5.5">
      <ElSegmented
        class="w-full"
        :model-value="viewMode"
        :options="viewOptions"
        :disabled="controlsDisabled"
        aria-label="切换视图"
        @change="emit('changeView', $event as ViewMode)"
      />
      <ElButton
        class="w-full"
        type="primary"
        :disabled="exportDisabled"
        :loading="isExporting"
        @click="emit('exportChart')"
      >
        <ElIcon v-if="!isExporting"><Download /></ElIcon>
        导出 PNG
      </ElButton>
      <p v-if="exportSuccess" class="-mt-1 m-0 text-[11px] leading-[1.45] text-success" role="status">PNG 已开始下载</p>
      <p v-if="exportError" class="-mt-1 m-0 text-[11px] leading-[1.45] text-danger" role="alert">{{ exportError }}</p>
    </div>
  </aside>
</template>
