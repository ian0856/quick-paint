<script setup lang="ts">
import { DataAnalysis, Histogram, TrendCharts, WarningFilled } from '@element-plus/icons-vue'
import { ElIcon, ElTooltip } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, shallowRef } from 'vue'
import { useWorkbenchStore } from '../../../stores/workbench'
import AxisSettings from './AxisSettings.vue'
import SeriesColorSettings from './SeriesColorSettings.vue'
import BarLayoutSettings from './BarLayoutSettings.vue'
import ChartCanvasSettings from './ChartCanvasSettings.vue'
import ChartDetailLabelSettings from './ChartDetailLabelSettings.vue'
import ChartLegendSettings from './ChartLegendSettings.vue'
import LinePointSettings from './LinePointSettings.vue'
import ChartTitleSettings from './ChartTitleSettings.vue'
import ChartTypeSettings from './ChartTypeSettings.vue'

type SettingsGroup = 'chart' | 'x-axis' | 'y-axis'

const settingsGroups = [
  { key: 'chart' as const, label: '图形', icon: DataAnalysis },
  { key: 'x-axis' as const, label: 'x轴', icon: TrendCharts },
  { key: 'y-axis' as const, label: 'y轴', icon: Histogram },
]

const store = useWorkbenchStore()
const activeGroup = shallowRef<SettingsGroup>('chart')
const {
  selectedWorksheet: worksheet,
  yAxisFields,
  chartSettings,
  chartResolution,
  sourceTableValidation,
  hasInvalidTableEdits,
  chartSettingsDisabled,
  activeColorScheme,
} = storeToRefs(store)

const series = computed(() => yAxisFields.value.flatMap((selection) => {
  const field = worksheet.value?.fields.find(item => item.id === selection.fieldId)
  return field
    ? [{
        fieldId: field.id,
        label: field.label,
        color: selection.color,
        detailLabelColor: selection.detailLabelColor,
        seriesGradient: selection.seriesGradient,
      }]
    : []
}))
const diagnostic = computed(() => {
  if (hasInvalidTableEdits.value) return sourceTableValidation.value.message
  const resolution = chartResolution.value
  return resolution && !resolution.valid ? resolution.diagnostic.message : null
})
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col" aria-label="高级设置">
    <div class="min-h-0 flex flex-1">
      <nav class="w-14 flex flex-none flex-col items-center border-r border-[#273246] bg-[#172033] px-1 py-3" aria-label="高级配置分组">
        <ElTooltip v-for="group in settingsGroups" :key="group.key" :content="group.label" placement="left">
          <button
            class="focus-ring mb-2 h-11 w-12 inline-flex cursor-pointer flex-col items-center justify-center gap-0.5 border-0 rounded-1 text-[9px]"
            :class="activeGroup === group.key ? 'bg-white text-primary' : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'"
            type="button"
            :aria-label="group.label"
            :aria-current="activeGroup === group.key ? 'page' : undefined"
            @click="activeGroup = group.key"
          >
            <ElIcon :size="16"><component :is="group.icon" /></ElIcon>
            <span>{{ group.label }}</span>
          </button>
        </ElTooltip>
      </nav>

      <div class="min-h-0 min-w-0 flex flex-1 flex-col">
        <div v-if="diagnostic" class="mx-4 mt-4 flex gap-2 border border-[#f1d39a] rounded-1 bg-[#fffaf0] p-2.5 text-[11px] leading-4 text-warning" role="status">
          <ElIcon class="mt-0.5 flex-none"><WarningFilled /></ElIcon>
          <span>{{ diagnostic }}</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto" :aria-disabled="chartSettingsDisabled">
          <div class="settings-group-header sticky top-0 border-b border-base bg-base px-4 py-3">
            <h3 class="m-0 text-sm font-600 text-text-strong">{{ settingsGroups.find(group => group.key === activeGroup)?.label }}属性</h3>
          </div>

          <div v-if="activeGroup === 'chart'" class="px-4 pb-6" :class="chartSettingsDisabled ? 'opacity-55' : ''">
            <div class="py-5">
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
            <div class="border-t border-base py-5">
              <ChartCanvasSettings
                :color="chartSettings.canvasColor"
                :disabled="chartSettingsDisabled"
                @update-color="store.updateCanvasColor"
              />
            </div>
            <div class="border-t border-base py-5">
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
            <div class="border-t border-base py-5">
              <SeriesColorSettings
                :series="series"
                :active-scheme="activeColorScheme"
                :show-series-gradient="chartSettings.chartType === 'line'"
                :disabled="chartSettingsDisabled"
                @select-scheme="store.selectSeriesColorScheme"
                @update-color="store.updateValueSeriesColor"
                @update-series-gradient="store.updateSeriesGradient"
              />
            </div>
            <div class="border-t border-base py-5">
              <ChartLegendSettings
                :key="worksheet?.id"
                :font-size="chartSettings.legendFontSize"
                :layout="chartSettings.legendLayout"
                :position="chartSettings.legendPosition"
                :disabled="chartSettingsDisabled"
                @update-font-size="store.updateLegendFontSize"
                @update-layout="store.updateLegendLayout"
                @update-position="store.updateLegendPosition"
              />
            </div>
            <div class="border-t border-base py-5">
              <ChartDetailLabelSettings
                :chart-type="chartSettings.chartType"
                :show-detail-labels="chartSettings.showDetailLabels"
                :show-inside-bars="chartSettings.showDetailLabelsInsideBars"
                :font-size="chartSettings.detailLabelFontSize"
                :fields="series.map(item => ({ fieldId: item.fieldId, label: item.label, color: item.detailLabelColor }))"
                :disabled="chartSettingsDisabled"
                @update-show-detail-labels="store.updateShowDetailLabels"
                @update-show-inside-bars="store.updateShowDetailLabelsInsideBars"
                @update-font-size="store.updateDetailLabelFontSize"
                @update-color="store.updateDetailLabelColor"
              />
            </div>
            <div v-if="chartSettings.chartType === 'line'" class="border-t border-base py-5">
              <LinePointSettings
                :show-points="chartSettings.showLinePoints"
                :hollow-points="chartSettings.hollowLinePoints"
                :disabled="chartSettingsDisabled"
                @update-show-points="store.updateShowLinePoints"
                @update-hollow-points="store.updateHollowLinePoints"
              />
            </div>
            <div v-else class="border-t border-base py-5">
              <BarLayoutSettings
                :rounded-bars="chartSettings.roundedBars"
                :show-bar-background="chartSettings.showBarBackground"
                :disabled="chartSettingsDisabled"
                @update-rounded-bars="store.updateRoundedBars"
                @update-show-bar-background="store.updateShowBarBackground"
              />
            </div>
          </div>

          <div v-else class="px-4 pb-6" :class="chartSettingsDisabled ? 'opacity-55' : ''">
            <AxisSettings
              :key="`${worksheet?.id}-${activeGroup}`"
              :axis="activeGroup === 'x-axis' ? 'x' : 'y'"
              :x-axis-name="chartSettings.xAxisName"
              :y-axis-name="chartSettings.yAxisName"
              :x-axis-name-font-size="chartSettings.xAxisNameFontSize"
              :y-axis-name-font-size="chartSettings.yAxisNameFontSize"
              :x-axis-name-color="chartSettings.xAxisNameColor"
              :y-axis-name-color="chartSettings.yAxisNameColor"
              :y-axis-unit="chartSettings.yAxisUnit"
              :y-axis-unit-display-locations="chartSettings.yAxisUnitDisplayLocations"
              :show-y-axis-split-lines="chartSettings.showYAxisSplitLines"
              :x-axis-tick-label-font-size="chartSettings.xAxisTickLabelFontSize"
              :y-axis-tick-label-font-size="chartSettings.yAxisTickLabelFontSize"
              :x-axis-tick-label-color="chartSettings.xAxisTickLabelColor"
              :y-axis-tick-label-color="chartSettings.yAxisTickLabelColor"
              :disabled="chartSettingsDisabled"
              @update-x-axis-name="store.updateXAxisName"
              @update-y-axis-name="store.updateYAxisName"
              @update-x-axis-name-font-size="store.updateXAxisNameFontSize"
              @update-y-axis-name-font-size="store.updateYAxisNameFontSize"
              @update-x-axis-name-color="store.updateXAxisNameColor"
              @update-y-axis-name-color="store.updateYAxisNameColor"
              @update-y-axis-unit="store.updateYAxisUnit"
              @update-y-axis-unit-display-locations="store.updateYAxisUnitDisplayLocations"
              @update-show-y-axis-split-lines="store.updateShowYAxisSplitLines"
              @update-x-axis-tick-label-font-size="store.updateXAxisTickLabelFontSize"
              @update-y-axis-tick-label-font-size="store.updateYAxisTickLabelFontSize"
              @update-x-axis-tick-label-color="store.updateXAxisTickLabelColor"
              @update-y-axis-tick-label-color="store.updateYAxisTickLabelColor"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-group-header {
  z-index: 1;
}
</style>
