<script setup lang="ts">
import { Close, Rank } from '@element-plus/icons-vue'
import { ElButton, ElIcon } from 'element-plus'
import { shallowRef } from 'vue'
import type { FieldId } from '../utils'

type OrderedYAxisField = {
  id: FieldId
  label: string
  color: string
}

const props = defineProps<{
  fields: OrderedYAxisField[]
  disabled: boolean
}>()

const emit = defineEmits<{
  reorder: [ids: FieldId[]]
  remove: [id: FieldId]
}>()

const draggingId = shallowRef<FieldId | null>(null)
const dropTargetId = shallowRef<FieldId | null>(null)
const dropAfter = shallowRef(false)

function onDragStart(event: DragEvent, fieldId: FieldId) {
  if (props.disabled || !event.dataTransfer) {
    event.preventDefault()
    return
  }
  draggingId.value = fieldId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(fieldId))
}

function onDragOver(event: DragEvent, fieldId: FieldId) {
  if (draggingId.value === null || draggingId.value === fieldId) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const target = event.currentTarget as HTMLElement
  dropTargetId.value = fieldId
  dropAfter.value = event.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2
}

function onDrop(event: DragEvent, fieldId: FieldId) {
  event.preventDefault()
  const sourceId = draggingId.value
  if (sourceId === null || sourceId === fieldId) {
    resetDrag()
    return
  }

  const ids = props.fields.map((field) => field.id).filter((id) => id !== sourceId)
  const targetIndex = ids.indexOf(fieldId)
  ids.splice(targetIndex + (dropAfter.value ? 1 : 0), 0, sourceId)
  emit('reorder', ids)
  resetDrag()
}

function resetDrag() {
  draggingId.value = null
  dropTargetId.value = null
  dropAfter.value = false
}
</script>

<template>
  <ul v-if="fields.length" class="m-0 flex flex-col gap-1 p-0" aria-label="y轴字段顺序">
    <li
      v-for="field in fields"
      :key="field.id"
      class="relative min-h-8.5 flex items-center gap-2 border border-base rounded-1 bg-canvas px-2 text-xs text-text-strong"
      :class="draggingId === field.id ? 'opacity-45' : ''"
      :data-field-id="field.id"
      @dragover="onDragOver($event, field.id)"
      @drop="onDrop($event, field.id)"
    >
      <span
        v-if="dropTargetId === field.id"
        class="pointer-events-none absolute left-0 h-0.5 w-full bg-primary"
        :class="dropAfter ? 'bottom--1' : 'top--1'"
        aria-hidden="true"
      />
      <span
        class="h-6 w-5 flex flex-none cursor-grab items-center justify-center text-muted active:cursor-grabbing"
        :draggable="!disabled"
        :title="`拖拽排序：${field.label}`"
        @dragstart="onDragStart($event, field.id)"
        @dragend="resetDrag"
      >
        <ElIcon><Rank /></ElIcon>
      </span>
      <span class="h-2.5 w-2.5 flex-none rounded-sm" :style="{ backgroundColor: field.color }" aria-hidden="true" />
      <span class="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-ellipsis" :title="field.label">
        {{ field.label }}
      </span>
      <ElButton
        text
        circle
        size="small"
        :disabled="disabled"
        :aria-label="`移除y轴字段：${field.label}`"
        :title="`移除 ${field.label}`"
        @click="emit('remove', field.id)"
      >
        <ElIcon><Close /></ElIcon>
      </ElButton>
    </li>
  </ul>
</template>
