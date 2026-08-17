<script setup lang="ts">
import { CircleCheck, Warning } from '@element-plus/icons-vue'
import ChartTypePicker from './ChartTypePicker.vue'
import CompositionWorkbench from './CompositionWorkbench.vue'
import { compositionState, fields, mappingRoles, mappingWarning, seriesSelection } from '../workbench/prototypeState'
</script>

<template>
  <CompositionWorkbench editor-name="分组检查器">
    <div class="editor-a">
      <section class="inspector-section">
        <h3><span>01</span>图表类型</h3>
        <ChartTypePicker />
      </section>

      <section class="inspector-section">
        <h3><span>02</span>字段映射</h3>
        <div class="control-section">
          <label>{{ mappingRoles.primary }} <em>必填</em></label>
          <el-select v-model="compositionState.categoryField" clearable placeholder="选择 Field">
            <el-option v-for="field in fields" :key="field.value" :label="`${field.label} · ${field.kind}`" :value="field.value" :disabled="compositionState.seriesFields.includes(field.value)" />
          </el-select>
        </div>
        <div class="control-section">
          <label>{{ mappingRoles.series }} <em>必填</em><small v-if="mappingRoles.multiple">最多 8 个</small></label>
          <el-select v-model="seriesSelection" :multiple="mappingRoles.multiple" collapse-tags :max-collapse-tags="2" clearable placeholder="选择数值 Field">
            <el-option v-for="field in fields" :key="field.value" :label="field.label" :value="field.value" :disabled="!field.numeric || field.value === compositionState.categoryField">
              <span>{{ field.label }}</span><small class="option-reason">{{ field.numeric ? field.detail : '不可用 · ' + field.detail }}</small>
            </el-option>
          </el-select>
        </div>
        <el-alert v-if="mappingWarning" :icon="Warning" :title="mappingWarning" type="warning" :closable="false" show-icon />
        <div v-else class="mapping-ok"><el-icon><CircleCheck /></el-icon>映射有效 · {{ compositionState.seriesFields.length }} 个 Series</div>
      </section>

      <section class="inspector-section">
        <h3><span>03</span>外观</h3>
        <div class="control-section"><label>标题</label><el-input v-model="compositionState.title" maxlength="60" show-word-limit /></div>
        <div class="inline-settings">
          <div><label>配色</label><div class="color-swatches"><button v-for="color in compositionState.palette" :key="color" :style="{ background: color }" :title="color" /></div></div>
          <div class="toggle-stack"><el-checkbox v-model="compositionState.showLegend">图例</el-checkbox><el-checkbox v-model="compositionState.showDataLabels">数据标签</el-checkbox></div>
        </div>
      </section>

      <section class="inspector-section">
        <h3><span>04</span>Chart Image</h3>
        <div class="size-controls"><el-input-number v-model="compositionState.width" :step="100" /><span>×</span><el-input-number v-model="compositionState.height" :step="100" /><span>px</span></div>
      </section>
    </div>
  </CompositionWorkbench>
</template>
