<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleCheck, Picture, SetUp } from '@element-plus/icons-vue'
import ChartTypePicker from './ChartTypePicker.vue'
import CompositionWorkbench from './CompositionWorkbench.vue'
import { compositionState, fields, mappingRoles, seriesSelection } from '../workbench/prototypeState'

const tab = ref('data')
const seriesNames = computed(() => compositionState.seriesFields.map((value) => fields.find((field) => field.value === value)?.label).filter(Boolean).join('、'))
</script>

<template>
  <CompositionWorkbench editor-name="分段检查器">
    <div class="editor-b">
      <el-tabs v-model="tab" stretch>
        <el-tab-pane label="数据" name="data">
          <ChartTypePicker />
          <div class="tab-section">
            <label>{{ mappingRoles.primary }}</label>
            <el-select v-model="compositionState.categoryField" clearable placeholder="选择 Field">
              <el-option v-for="field in fields" :key="field.value" :label="field.label" :value="field.value" :disabled="compositionState.seriesFields.includes(field.value)" />
            </el-select>
          </div>
          <div class="tab-section">
            <label>{{ mappingRoles.series }}</label>
            <el-select v-model="seriesSelection" :multiple="mappingRoles.multiple" clearable placeholder="选择数值 Field">
              <el-option v-for="field in fields" :key="field.value" :label="field.numeric ? field.label : `${field.label}（不可用于数值）`" :value="field.value" :disabled="!field.numeric || field.value === compositionState.categoryField" />
            </el-select>
          </div>
          <div class="mapping-summary">
            <div><span>{{ mappingRoles.primary }}</span><strong>{{ fields.find((field) => field.value === compositionState.categoryField)?.label || '未选择' }}</strong></div>
            <div><span>Series</span><strong>{{ seriesNames || '未选择' }}</strong></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="外观" name="appearance">
          <div class="tab-section"><label>图表标题</label><el-input v-model="compositionState.title" type="textarea" :rows="2" maxlength="60" show-word-limit /></div>
          <div class="tab-section"><label>Series 配色</label><div class="series-colors"><div v-for="(value, index) in compositionState.seriesFields" :key="value"><span><i :style="{ background: compositionState.palette[index] }" />{{ fields.find((field) => field.value === value)?.label }}</span><el-color-picker v-model="compositionState.palette[index]" /></div></div></div>
          <div class="binary-row"><span><el-icon><SetUp /></el-icon>图例</span><el-switch v-model="compositionState.showLegend" /></div>
          <div class="binary-row"><span><el-icon><Picture /></el-icon>数据标签</span><el-switch v-model="compositionState.showDataLabels" /></div>
        </el-tab-pane>

        <el-tab-pane label="图片" name="image">
          <div class="preset-grid"><el-radio-group v-model="compositionState.width"><el-radio-button :value="1600">16:9</el-radio-button><el-radio-button :value="1200">1:1</el-radio-button><el-radio-button :value="1080">4:5</el-radio-button></el-radio-group></div>
          <div class="dimension-row"><div><label>宽度</label><el-input-number v-model="compositionState.width" :step="100" /></div><span>×</span><div><label>高度</label><el-input-number v-model="compositionState.height" :step="100" /></div></div>
          <div class="image-status"><el-icon><CircleCheck /></el-icon><div><strong>PNG 已就绪</strong><span>{{ compositionState.width }} × {{ compositionState.height }} px</span></div></div>
        </el-tab-pane>
      </el-tabs>
      <div class="editor-b-footer"><span>预览实时更新</span><strong>{{ compositionState.seriesFields.length }} 个 Series</strong></div>
    </div>
  </CompositionWorkbench>
</template>
