<script setup lang="ts">
import { ref } from 'vue'
import { DataLine, Download, Fold, Grid, UploadFilled } from '@element-plus/icons-vue'
import ChartPreview from './ChartPreview.vue'
import CompositionControls from './CompositionControls.vue'
import DataTable from './DataTable.vue'
import { acceptPrototypeFile, compositionState } from './prototypeState'

const showData = ref(false)
</script>

<template>
  <main class="app-shell variant-b">
    <header class="app-header dark-header">
      <div class="brand"><span class="brand-mark"><DataLine /></span><strong>Quick Paint</strong><span class="file-crumb">/ {{ compositionState.dataSource }}</span></div>
      <div class="header-actions"><el-button text class="dark-button" @click="showData = true"><el-icon><Grid /></el-icon>查看数据</el-button><el-button type="primary"><el-icon><Download /></el-icon>导出 PNG</el-button></div>
    </header>
    <div class="b-workspace">
      <nav class="b-rail">
        <el-tooltip content="Data Source" placement="right"><el-button circle type="primary"><el-icon><UploadFilled /></el-icon></el-button></el-tooltip>
        <span class="rail-line" />
        <el-tooltip content="Chart Composition" placement="right"><el-button circle><el-icon><DataLine /></el-icon></el-button></el-tooltip>
        <span class="rail-line muted" />
        <el-tooltip content="Chart Image" placement="right"><el-button circle><el-icon><Download /></el-icon></el-button></el-tooltip>
      </nav>
      <section class="b-canvas">
        <div class="canvas-toolbar">
          <div><span class="status-dot" />{{ compositionState.worksheet }}<small>6 行 × 5 列</small></div>
          <el-upload :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv"><el-button text>更换数据</el-button></el-upload>
        </div>
        <div class="canvas-area"><ChartPreview /></div>
        <section class="property-dock">
          <div class="dock-title"><el-icon><Fold /></el-icon><span><strong>Chart Composition</strong><small>调整后立即预览</small></span></div>
          <CompositionControls />
          <div class="dock-size"><label>尺寸</label><el-select v-model="compositionState.width"><el-option label="1600 × 900" :value="1600" /><el-option label="1200 × 1200" :value="1200" /></el-select></div>
        </section>
      </section>
    </div>

    <el-drawer v-model="showData" title="数据预览" size="62%">
      <div class="drawer-meta"><strong>{{ compositionState.worksheet }}</strong><span>{{ compositionState.dataSource }}</span></div>
      <DataTable />
    </el-drawer>
  </main>
</template>
