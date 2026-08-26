<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useWorkbenchStore } from '../../../stores/workbench'
import AxisSettings from './AxisSettings.vue'
import SeriesColorSettings from './SeriesColorSettings.vue'
import BarLayoutSettings from './BarLayoutSettings.vue'
import ChartDetailLabelSettings from './ChartDetailLabelSettings.vue'
import ChartLabelSettings from './ChartLabelSettings.vue'
import ChartTitleSettings from './ChartTitleSettings.vue'
import ChartTypeSettings from './ChartTypeSettings.vue'

const store = useWorkbenchStore()
const {
  selectedWorksheet: worksheet,
  yAxisFields,
  chartSettings,
  chartResolution,
  sourceTableValidation,
  hasInvalidTableEdits,
  chartSettingsDisabled,
  activeColorScheme,
  currentYAxisSpan,
} = storeToRefs(store)

const series = computed(() => yAxisFields.value.flatMap((selection) => {
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
        <ChartTypeSettings
          :chart-type="chartSettings.chartType"
          :line-style="chartSettings.lineStyle"
          :area-fill="chartSettings.areaFill"
          :disabled="chartSettingsDisabled"
          @update-chart-type="store.updateChartType"
          @update-line-style="store.updateLineStyle"
          @update-area-fill="store.updateAreaFill"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <ChartDetailLabelSettings
          :show-detail-labels="chartSettings.showDetailLabels"
          :font-size="chartSettings.detailLabelFontSize"
          :color="chartSettings.detailLabelColor"
          :disabled="chartSettingsDisabled"
          @update-show-detail-labels="store.updateShowDetailLabels"
          @update-font-size="store.updateDetailLabelFontSize"
          @update-color="store.updateDetailLabelColor"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <ChartTitleSettings
          :key="worksheet?.id"
          :title="chartSettings.title"
          :font-size="chartSettings.titleFontSize"
          :color="chartSettings.titleColor"
          :disabled="chartSettingsDisabled"
          @update-title="store.updateTitle"
          @update-font-size="store.updateTitleFontSize"
          @update-color="store.updateTitleColor"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <SeriesColorSettings
          :series="series"
          :active-scheme="activeColorScheme"
          :disabled="chartSettingsDisabled"
          @select-scheme="store.selectSeriesColorScheme"
          @update-color="store.updateValueSeriesColor"
        />
      </div>
      <div v-if="chartSettings.chartType === 'bar'" class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <BarLayoutSettings
          :max-bar-thickness="chartSettings.maxBarThickness"
          :disabled="chartSettingsDisabled"
          @update-max-bar-thickness="store.updateMaxBarThickness"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <ChartLabelSettings
          :key="worksheet?.id"
          :font-size="chartSettings.chartLabelFontSize"
          :disabled="chartSettingsDisabled"
          @update-font-size="store.updateChartLabelFontSize"
        />
      </div>
      <div class="border-t border-base py-5" :class="chartSettingsDisabled ? 'opacity-55' : ''">
        <AxisSettings
          :key="worksheet?.id"
          :x-axis-name="chartSettings.xAxisName"
          :y-axis-name="chartSettings.yAxisName"
          :x-axis-name-font-size="chartSettings.xAxisNameFontSize"
          :y-axis-name-font-size="chartSettings.yAxisNameFontSize"
          :x-axis-name-color="chartSettings.xAxisNameColor"
          :y-axis-name-color="chartSettings.yAxisNameColor"
          :y-axis-unit="chartSettings.yAxisUnit"
          :x-axis-tick-label-font-size="chartSettings.xAxisTickLabelFontSize"
          :y-axis-tick-label-font-size="chartSettings.yAxisTickLabelFontSize"
          :x-axis-tick-label-color="chartSettings.xAxisTickLabelColor"
          :y-axis-tick-label-color="chartSettings.yAxisTickLabelColor"
          :interval-mode="chartSettings.yAxisTickIntervalMode"
          :fixed-interval="chartSettings.fixedYAxisTickInterval"
          :y-axis-span="currentYAxisSpan"
          :disabled="chartSettingsDisabled"
          @update-x-axis-name="store.updateXAxisName"
          @update-y-axis-name="store.updateYAxisName"
          @update-x-axis-name-font-size="store.updateXAxisNameFontSize"
          @update-y-axis-name-font-size="store.updateYAxisNameFontSize"
          @update-x-axis-name-color="store.updateXAxisNameColor"
          @update-y-axis-name-color="store.updateYAxisNameColor"
          @update-y-axis-unit="store.updateYAxisUnit"
          @update-x-axis-tick-label-font-size="store.updateXAxisTickLabelFontSize"
          @update-y-axis-tick-label-font-size="store.updateYAxisTickLabelFontSize"
          @update-x-axis-tick-label-color="store.updateXAxisTickLabelColor"
          @update-y-axis-tick-label-color="store.updateYAxisTickLabelColor"
          @update-interval-mode="store.updateYAxisTickIntervalMode"
          @update-fixed-interval="store.updateFixedYAxisTickInterval"
        />
      </div>
    </div>
  </div>
</template>
