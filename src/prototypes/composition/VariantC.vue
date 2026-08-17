<script setup lang="ts">
import { ArrowRight, Brush, Picture } from '@element-plus/icons-vue'
import ChartTypePicker from './ChartTypePicker.vue'
import CompositionWorkbench from './CompositionWorkbench.vue'
import { compositionState, fields, mappingRoles, seriesSelection } from '../workbench/prototypeState'
</script>

<template>
  <CompositionWorkbench editor-name="映射画布">
    <div class="editor-c">
      <ChartTypePicker />
      <div class="field-map-heading"><span>Field</span><span>Mapping Role</span></div>
      <div class="mapping-canvas">
        <div class="field-bank">
          <button v-for="field in fields" :key="field.value" :class="{ used: field.value === compositionState.categoryField || compositionState.seriesFields.includes(field.value), disabled: !field.numeric && field.value !== compositionState.categoryField }">
            <i :class="field.numeric ? 'type-number' : 'type-text'">{{ field.numeric ? '数' : '文' }}</i><span><strong>{{ field.label }}</strong><small>{{ field.kind }}</small></span>
          </button>
        </div>
        <el-icon class="map-arrow"><ArrowRight /></el-icon>
        <div class="role-bank">
          <div class="role-slot">
            <label>{{ mappingRoles.primary }}</label>
            <el-select v-model="compositionState.categoryField" clearable placeholder="未映射">
              <el-option v-for="field in fields" :key="field.value" :label="field.label" :value="field.value" :disabled="compositionState.seriesFields.includes(field.value)" />
            </el-select>
          </div>
          <div class="role-slot series-slot">
            <label>{{ mappingRoles.series }}</label>
            <el-select v-model="seriesSelection" :multiple="mappingRoles.multiple" collapse-tags clearable placeholder="未映射">
              <el-option v-for="field in fields" :key="field.value" :label="field.label" :value="field.value" :disabled="!field.numeric || field.value === compositionState.categoryField" />
            </el-select>
            <small>{{ compositionState.seriesFields.length }} / 8 Series</small>
          </div>
        </div>
      </div>

      <el-collapse class="compact-collapse">
        <el-collapse-item name="appearance">
          <template #title><el-icon><Brush /></el-icon><span>外观与标签</span><strong>{{ compositionState.showLegend ? '图例开' : '图例关' }}</strong></template>
          <div class="collapse-body"><label>标题</label><el-input v-model="compositionState.title" /><div class="binary-row"><span>显示图例</span><el-switch v-model="compositionState.showLegend" /></div><div class="binary-row"><span>显示数据标签</span><el-switch v-model="compositionState.showDataLabels" /></div></div>
        </el-collapse-item>
        <el-collapse-item name="image">
          <template #title><el-icon><Picture /></el-icon><span>Chart Image</span><strong>{{ compositionState.width }} × {{ compositionState.height }}</strong></template>
          <div class="dimension-row"><el-input-number v-model="compositionState.width" :step="100" /><span>×</span><el-input-number v-model="compositionState.height" :step="100" /></div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </CompositionWorkbench>
</template>
