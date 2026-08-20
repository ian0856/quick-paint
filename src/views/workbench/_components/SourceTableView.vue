<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import type { WorksheetInterpretation } from '../utils'

const props = defineProps<{ worksheet: WorksheetInterpretation }>()
const scroller = useTemplateRef<HTMLDivElement>('scroller')
const scrollTop = shallowRef(0)
const viewportHeight = shallowRef(600)
const rowHeight = 38
const overscan = 8
let resizeObserver: ResizeObserver | null = null

const tableWidth = computed(() => 58 + props.worksheet.fields.length * 180)
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / rowHeight) - overscan))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / rowHeight) + overscan * 2)
const endIndex = computed(() => Math.min(props.worksheet.recordCount, startIndex.value + visibleCount.value))
const visibleRows = computed(() =>
  Array.from({ length: Math.max(0, endIndex.value - startIndex.value) }, (_, offset) => startIndex.value + offset),
)

function onScroll(event: Event) {
  scrollTop.value = (event.currentTarget as HTMLElement).scrollTop
}

onMounted(() => {
  if (!scroller.value) return
  viewportHeight.value = scroller.value.clientHeight
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) viewportHeight.value = entry.contentRect.height
  })
  resizeObserver.observe(scroller.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <section class="h-full min-h-0 min-w-0 w-full grid grid-rows-[52px_minmax(0,1fr)] bg-base" aria-label="数据表格">
    <header class="flex items-center justify-between border-b border-base px-5">
      <strong class="text-[13px] text-text-strong">{{ worksheet.name }}</strong>
      <span class="text-caption">{{ worksheet.recordCount.toLocaleString('zh-CN') }} 行 · {{ worksheet.fields.length }} 列</span>
    </header>
    <div
      ref="scroller"
      class="relative min-h-0 min-w-0 overflow-auto"
      role="table"
      aria-label="数据表格"
      :aria-rowcount="worksheet.recordCount + 1"
      @scroll="onScroll"
    >
      <div class="min-w-full" :style="{ width: `${tableWidth}px` }">
        <div class="sticky z-2 top-0 h-12 flex border-b border-border-strong bg-[#f7f8fa]" role="row" :style="{ width: `${tableWidth}px` }">
          <div class="table-cell w-14.5 justify-end bg-[#fafbfc] text-muted tabular-nums select-none flex-col items-start justify-center text-[11px] text-text-strong" role="columnheader">行</div>
          <div
            v-for="field in worksheet.fields"
            :key="field.id"
            class="table-cell w-45 flex-col items-start justify-center text-[11px] text-text-strong"
            role="columnheader"
            :title="`${field.label} · ${field.sourceColumn} 列`"
          >
            <strong>{{ field.label }}</strong>
            <span class="text-[9px] font-400 text-muted">{{ field.sourceColumn }} 列</span>
          </div>
        </div>
        <div class="relative" :style="{ height: `${worksheet.recordCount * rowHeight}px` }">
          <div
            v-for="rowIndex in visibleRows"
            :key="rowIndex"
            class="absolute left-0 h-9.5 flex border-b border-base bg-base hover:bg-[#f8faff]"
            role="row"
            :aria-rowindex="rowIndex + 2"
            :style="{ top: `${rowIndex * rowHeight}px`, width: `${tableWidth}px` }"
          >
            <div class="table-cell w-14.5 justify-end bg-[#fafbfc] text-muted tabular-nums select-none" role="rowheader">{{ rowIndex + 2 }}</div>
            <div
              v-for="field in worksheet.fields"
              :key="field.id"
              class="table-cell w-45"
              role="cell"
              :title="field.values[rowIndex]?.display || '（空白）'"
            >
              {{ field.values[rowIndex]?.display || '（空白）' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
