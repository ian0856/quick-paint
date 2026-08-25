<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import VGrid from '@revolist/vue3-datagrid'
import type {
  AfterEditEvent,
  ColumnRegular,
  DataType,
  FocusAfterRenderEvent,
  RevoGridCustomEvent,
  TempRange,
} from '@revolist/vue3-datagrid'
import { ElButton, ElIcon } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'
import type {
  FieldId,
  SourceTableCellError,
  SourceTableChange,
  WorksheetInterpretation,
} from '../utils'

type GridRow = Record<string, string | number> & { __rowIndex: number }

const props = defineProps<{
  worksheet: WorksheetInterpretation
  cellErrors: SourceTableCellError[]
  validationMessage: string | null
}>()
const emit = defineEmits<{
  change: [changes: SourceTableChange[]]
  insertRow: []
  deleteRows: [rowIndexes: number[]]
}>()

const selectedRowIndexes = shallowRef<number[]>([])
const gridElement = shallowRef<HTMLRevoGridElement | null>(null)
const selectedRowCount = computed(() => selectedRowIndexes.value.length)
const fieldProp = (fieldId: FieldId) => `field_${fieldId}`
const fieldByProp = computed(() => new Map(
  props.worksheet.fields.map(field => [fieldProp(field.id), field]),
))
const errorsByCell = computed(() => new Map(
  props.cellErrors.map(error => [`${error.rowIndex}:${error.fieldId}`, error.message]),
))
const source = computed<GridRow[]>(() => Array.from(
  { length: props.worksheet.recordCount },
  (_, rowIndex) => Object.fromEntries([
    ['__rowIndex', rowIndex],
    ...props.worksheet.fields.map(field => [fieldProp(field.id), field.values[rowIndex]?.display ?? '']),
  ]) as GridRow,
))
const columns = computed<ColumnRegular[]>(() =>
  props.worksheet.fields.map(field => ({
    prop: fieldProp(field.id),
    name: field.label,
    size: 180,
    minSize: 110,
    sortable: false,
    cellProperties: ({ rowIndex }) => {
      const error = errorsByCell.value.get(`${rowIndex}:${field.id}`)
      if (!error) return { title: field.values[rowIndex]?.display || '（空白）' }
      return {
        title: error,
        'aria-invalid': 'true',
        'aria-label': error,
        style: {
          backgroundColor: '#fff1f1',
          boxShadow: 'inset 0 0 0 1px #c83b3b',
          color: '#a72e2e',
        },
      }
    },
  })),
)

watch(() => [props.worksheet.id, props.worksheet.recordCount], () => {
  selectedRowIndexes.value = []
})

function onAfterEdit(event: RevoGridCustomEvent<AfterEditEvent>) {
  const detail = event.detail
  if ('prop' in detail) {
    const field = fieldByProp.value.get(String(detail.prop))
    if (field) emit('change', [{ rowIndex: detail.rowIndex, fieldId: field.id, value: detail.val }])
    return
  }

  const changes: SourceTableChange[] = []
  for (const [rowIndexText, row] of Object.entries(detail.data)) {
    const rowIndex = Number(rowIndexText)
    for (const [prop, field] of fieldByProp.value) {
      if (Object.hasOwn(row, prop)) changes.push({ rowIndex, fieldId: field.id, value: row[prop] })
    }
  }
  if (changes.length > 0) emit('change', changes)
}

async function onAfterFocus(event: RevoGridCustomEvent<FocusAfterRenderEvent<DataType>>) {
  gridElement.value = event.currentTarget as HTMLRevoGridElement
  const rowIndex = event.detail.rowIndex
  if (!selectedRowIndexes.value.includes(rowIndex)) selectedRowIndexes.value = [rowIndex]
  await syncSelectedRows()
}

function onTemporaryRangeChange(event: RevoGridCustomEvent<TempRange | null>) {
  gridElement.value = event.currentTarget as HTMLRevoGridElement
  if (event.detail) updateSelectedRows(event.detail.area)
}

function updateSelectedRows({ y, y1 }: { y: number, y1: number }) {
  const start = Math.min(y, y1)
  const end = Math.max(y, y1)
  selectedRowIndexes.value = Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
}

async function syncSelectedRows() {
  const grid = gridElement.value
  if (!grid || typeof grid.getSelectedRange !== 'function') return
  const range = await grid.getSelectedRange()
  if (!range) return
  updateSelectedRows(range)
}

async function deleteSelectedRows() {
  await syncSelectedRows()
  if (selectedRowIndexes.value.length === 0) return
  emit('deleteRows', selectedRowIndexes.value.slice())
  selectedRowIndexes.value = []
}
</script>

<template>
  <section class="h-full min-h-0 min-w-0 w-full grid grid-rows-[58px_minmax(0,1fr)] bg-base" aria-label="数据表格">
    <header class="min-w-0 flex items-center justify-between gap-4 border-b border-base px-5">
      <div class="min-w-0 flex items-center gap-3">
        <strong class="max-w-52 truncate text-[13px] text-text-strong" :title="worksheet.name">{{ worksheet.name }}</strong>
        <span class="text-caption">{{ worksheet.recordCount.toLocaleString('zh-CN') }} 行 · {{ worksheet.fields.length }} 列</span>
        <span v-if="validationMessage" class="max-w-92 truncate text-[11px] text-danger" :title="validationMessage" role="alert">
          {{ validationMessage }}
        </span>
      </div>
      <div class="flex flex-none items-center gap-2" aria-label="表格行操作">
        <ElButton size="small" @click="emit('insertRow')">
          <ElIcon><Plus /></ElIcon>
          新增行
        </ElButton>
        <ElButton size="small" :disabled="selectedRowCount === 0" @click="deleteSelectedRows">
          <ElIcon><Delete /></ElIcon>
          {{ selectedRowCount > 1 ? `删除 ${selectedRowCount} 行` : '删除行' }}
        </ElButton>
      </div>
    </header>
    <VGrid
      class="source-grid min-h-0 min-w-0"
      :source="source"
      :columns="columns"
      :row-headers="true"
      :range="true"
      :use-clipboard="true"
      :resize="true"
      :can-move-columns="false"
      :accessible="true"
      aria-label="数据表格"
      @afteredit="onAfterEdit"
      @afterfocus="onAfterFocus"
      @settemprange="onTemporaryRangeChange"
    />
  </section>
</template>

<style scoped>
.source-grid {
  display: block;
  height: 100%;
  width: 100%;
  --rg-header-background: #f7f8fa;
  --rg-header-color: #172033;
  --rg-border-color: #e5e8ee;
  --rg-selection-border-color: #2f6fed;
  --rg-selection-background-color: rgb(47 111 237 / 8%);
}
</style>
