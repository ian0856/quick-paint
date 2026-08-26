<script setup lang="ts">
import { ElColorPicker, ElRadio, ElRadioGroup, ElSwitch } from 'element-plus'
import { SERIES_COLOR_SCHEMES, type FieldId, type SeriesColorSchemeId, type SeriesColorSchemeSelection } from '../utils'

defineProps<{
  series: Array<{ fieldId: FieldId; label: string; color: string; seriesGradient: boolean }>
  activeScheme: SeriesColorSchemeSelection
  showSeriesGradient: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  selectScheme: [id: SeriesColorSchemeId]
  updateColor: [fieldId: FieldId, color: string]
  updateSeriesGradient: [fieldId: FieldId, value: boolean]
}>()

function updateColor(fieldId: FieldId, color: string | null) {
  if (color) emit('updateColor', fieldId, color)
}
</script>

<template>
  <section aria-labelledby="bar-color-settings-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="bar-color-settings-title" class="m-0 text-xs font-600 text-text-strong">系列配色</h3>
      <span class="text-caption">{{ activeScheme === 'custom' ? '自定义' : '内置方案' }}</span>
    </div>

    <ElRadioGroup
      class="mt-3 w-full flex flex-col items-stretch gap-1.5"
      :model-value="activeScheme"
      :disabled="disabled"
      aria-label="配色方案"
      @change="emit('selectScheme', $event as SeriesColorSchemeId)"
    >
      <ElRadio
        v-for="scheme in SERIES_COLOR_SCHEMES"
        :key="scheme.id"
        class="scheme-option m-0! h-9! w-full! border border-base rounded-1 px-2.5!"
        :value="scheme.id"
      >
        <span class="min-w-0 flex items-center gap-2">
          <span class="w-13 flex flex-none text-xs">{{ scheme.label }}</span>
          <span class="flex items-center gap-1" aria-hidden="true">
            <span
              v-for="color in scheme.colors"
              :key="color"
              class="h-3 w-3 rounded-sm border border-black/8"
              :style="{ backgroundColor: color }"
            />
          </span>
        </span>
      </ElRadio>
    </ElRadioGroup>

    <div class="mt-4 flex flex-col" aria-label="数值系列颜色">
      <div
        v-for="item in series"
        :key="item.fieldId"
        class="min-h-10 flex items-center gap-3 border-t border-base py-1.5 first:border-t-0"
      >
        <span class="min-w-0 flex-1 truncate text-xs text-text" :title="item.label">{{ item.label }}</span>
        <div class="flex flex-none items-center gap-2">
          <ElColorPicker
            :model-value="item.color"
            :disabled="disabled"
            :show-alpha="false"
            :predefine="SERIES_COLOR_SCHEMES.flatMap(scheme => [...scheme.colors])"
            :aria-label="`设置系列颜色：${item.label}`"
            @change="updateColor(item.fieldId, $event)"
          />
          <ElSwitch
            v-if="showSeriesGradient"
            :model-value="item.seriesGradient"
            :disabled="disabled"
            inline-prompt
            active-text="渐"
            inactive-text="渐"
            :aria-label="`Series Gradient：${item.label}`"
            @change="emit('updateSeriesGradient', item.fieldId, $event as boolean)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scheme-option :deep(.el-radio__label) {
  min-width: 0;
  flex: 1;
  padding-left: 8px;
}
</style>
