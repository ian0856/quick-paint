<script setup lang="ts">
import { chartTypes, compositionState, fields } from './prototypeState'
</script>

<template>
  <div class="composition-controls">
    <div class="control-section">
      <label>图表类型</label>
      <el-segmented v-model="compositionState.chartType" :options="chartTypes" block />
    </div>
    <div class="control-grid">
      <div>
        <label>分类</label>
        <el-select v-model="compositionState.categoryField">
          <el-option v-for="field in fields" :key="field.value" :label="field.label" :value="field.value" />
        </el-select>
      </div>
      <div>
        <label>数值</label>
        <el-select v-model="compositionState.valueField">
          <el-option v-for="field in fields.filter((item) => item.kind === '数字')" :key="field.value" :label="field.label" :value="field.value" />
        </el-select>
      </div>
    </div>
    <div class="control-section">
      <label>标题</label>
      <el-input v-model="compositionState.title" maxlength="60" />
    </div>
    <div class="control-grid compact">
      <div>
        <label>主题色</label>
        <el-color-picker v-model="compositionState.color" />
      </div>
      <div class="switch-control">
        <label>显示图例</label>
        <el-switch v-model="compositionState.showLegend" />
      </div>
    </div>
  </div>
</template>
