<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useWorkbenchStore } from '../../../stores/workbench'
import AxisSettings from './AxisSettings.vue'
import BarColorSettings from './BarColorSettings.vue'
import BarLayoutSettings from './BarLayoutSettings.vue'

const store = useWorkbenchStore()
const {
  selectedWorksheet: worksheet,
  valueFields,
  chartSettings,
  chartResolution,
  sourceTableValidation,
  hasInvalidTableEdits,
  chartSettingsDisabled,
  activeColorScheme,
  currentValueAxisSpan,
} = storeToRefs(store)

const series = computed(() => valueFields.value.flatMap((selection) => {
  const field = worksheet.value?.fields.find(item => item.id === selection.fieldId)
  return field ? [{ fieldId: field.id, label: field.label, color: selection.color }] : []
}))
const diagnostic = computed(() => {
  if (hasInvalidTableEdits.value) return sourceTableValidation.value.message
  const resolution = chartResolution.value
  return resolution && !resolution.valid ? resolution.diagnostic.message : null
})
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col" aria-label="高级设置">
    <div v-if="diagnostic" class="mx-5 mt-4 flex gap-2 border border-[#f1d39a] rounded-1 bg-[#fffaf0] p-2.5 text-[11px] leading-4 text-warning" role="status">
      <ElIcon class="mt-0.5 flex-none"><WarningFilled /></ElIcon>
      <span>{{ diagnostic }}</span>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-6" :aria-disabled="chartSettingsDisabled">
      <div class="py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <BarColorSettings
          :series="series"
          :active-scheme="activeColorScheme"
          :disabled="chartSettingsDisabled"
          @select-scheme="store.selectBarColorScheme"
          @update-color="store.updateValueSeriesColor"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <BarLayoutSettings
          :max-bar-thickness="chartSettings.maxBarThickness"
          :disabled="chartSettingsDisabled"
          @update-max-bar-thickness="store.updateMaxBarThickness"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <AxisSettings
          :key="worksheet?.id"
          :category-axis-name="chartSettings.categoryAxisName"
          :value-axis-name="chartSettings.valueAxisName"
          :interval-mode="chartSettings.valueAxisTickIntervalMode"
          :fixed-interval="chartSettings.fixedValueAxisTickInterval"
          :value-span="currentValueAxisSpan"
          :disabled="chartSettingsDisabled"
          @update-category-axis-name="store.updateCategoryAxisName"
          @update-value-axis-name="store.updateValueAxisName"
          @update-interval-mode="store.updateValueAxisTickIntervalMode"
          @update-fixed-interval="store.updateFixedValueAxisTickInterval"
        />
      </div>
    </div>
  </div>
</template>
