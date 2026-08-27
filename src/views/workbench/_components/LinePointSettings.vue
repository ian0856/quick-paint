<script setup lang="ts">
import { ElColorPicker, ElInputNumber, ElSwitch } from 'element-plus'
import { MAX_LINE_POINT_RADIUS, MIN_LINE_POINT_RADIUS } from '../utils'

defineProps<{
  showPoints: boolean
  hollowPoints: boolean
  pointRadius: number
  pointColor: string | null
  disabled: boolean
}>()

const emit = defineEmits<{
  updateShowPoints: [value: boolean]
  updateHollowPoints: [value: boolean]
  updatePointRadius: [value: number]
  updatePointColor: [value: string | null]
}>()

function updatePointRadius(value: number | undefined) {
  if (value !== undefined) emit('updatePointRadius', value)
}
</script>

<template>
  <section aria-labelledby="line-point-settings-title">
    <h3 id="line-point-settings-title" class="m-0 text-xs font-600 text-text-strong">节点</h3>
    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs font-600 text-text-strong">显示节点</span>
      <ElSwitch
        :model-value="showPoints"
        :disabled="disabled"
        aria-label="显示节点"
        @change="emit('updateShowPoints', $event as boolean)"
      />
    </div>
    <div v-if="showPoints" class="mt-4 border-t border-base pt-4">
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div>
          <label class="control-label mt-0 block" for="line-point-radius">节点半径</label>
          <ElInputNumber
            id="line-point-radius"
            class="mt-1 w-full"
            :model-value="pointRadius"
            :disabled="disabled"
            :min="MIN_LINE_POINT_RADIUS"
            :max="MAX_LINE_POINT_RADIUS"
            :step="1"
            :precision="0"
            controls-position="right"
            aria-label="节点半径"
            @change="updatePointRadius"
          />
        </div>
        <div>
          <span class="control-label mt-0 block">节点颜色</span>
          <ElColorPicker
            class="mt-1"
            :model-value="pointColor"
            :disabled="disabled"
            :show-alpha="false"
            aria-label="节点颜色"
            @change="emit('updatePointColor', $event)"
          />
        </div>
      </div>
      <div class="mt-3 flex items-center justify-between gap-3">
        <span class="text-xs font-600 text-text-strong">节点镂空</span>
        <ElSwitch
          :model-value="hollowPoints"
          :disabled="disabled"
          aria-label="节点镂空"
          @change="emit('updateHollowPoints', $event as boolean)"
        />
      </div>
    </div>
  </section>
</template>
