<script setup lang="ts">
import { ref } from 'vue'
import { DataLine, Download, FolderOpened, Grid, UploadFilled } from '@element-plus/icons-vue'
import ChartPreview from './ChartPreview.vue'
import CompositionControls from './CompositionControls.vue'
import DataTable from './DataTable.vue'
import { acceptPrototypeFile, compositionState } from './prototypeState'

const centerView = ref('preview')
</script>

<template>
  <main class="app-shell variant-a">
    <header class="app-header">
      <div class="brand"><span class="brand-mark"><DataLine /></span><strong>Quick Paint</strong></div>
      <div class="header-actions"><span class="save-status">所有更改仅保留在当前页面</span><el-button type="primary"><el-icon><Download /></el-icon>导出 PNG</el-button></div>
    </header>
    <div class="a-workspace">
      <aside class="source-panel">
        <div class="panel-heading"><span>Data Source</span><el-tag size="small" type="success">就绪</el-tag></div>
        <el-upload :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv">
          <el-button class="source-file" plain><el-icon><FolderOpened /></el-icon><span><strong>{{ compositionState.dataSource }}</strong><small>248 KB · 本地文件</small></span></el-button>
        </el-upload>
        <label>Worksheet</label>
        <el-select v-model="compositionState.worksheet"><el-option label="区域销售" value="区域销售" /><el-option label="产品销售" value="产品销售" /></el-select>
        <div class="source-meta"><span>6 行</span><span>5 列</span><span>无空值</span></div>
        <el-upload :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv">
          <el-button text><el-icon><UploadFilled /></el-icon>更换 Data Source</el-button>
        </el-upload>
        <div class="a-steps">
          <div class="done"><b>1</b><span>选择数据<small>已完成</small></span></div>
          <div class="active"><b>2</b><span>配置图表<small>正在编辑</small></span></div>
          <div><b>3</b><span>导出图片<small>PNG</small></span></div>
        </div>
      </aside>

      <section class="a-center">
        <div class="view-toolbar">
          <el-segmented v-model="centerView" :options="[{ label: '图表预览', value: 'preview' }, { label: '数据预览', value: 'data' }]" />
          <span v-if="centerView === 'preview'">1600 × 900 px</span>
        </div>
        <div class="a-stage">
          <ChartPreview v-if="centerView === 'preview'" />
          <DataTable v-else />
        </div>
      </section>

      <aside class="settings-panel">
        <div class="panel-heading"><span>Chart Composition</span><el-icon><Grid /></el-icon></div>
        <CompositionControls />
        <div class="export-size"><label>Chart Image 尺寸</label><div><el-input-number v-model="compositionState.width" :step="100" /><span>×</span><el-input-number v-model="compositionState.height" :step="100" /></div></div>
      </aside>
    </div>
  </main>
</template>
