<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, DataLine, Download, UploadFilled } from '@element-plus/icons-vue'
import ChartPreview from './ChartPreview.vue'
import CompositionControls from './CompositionControls.vue'
import DataTable from './DataTable.vue'
import { acceptPrototypeFile, compositionState } from './prototypeState'

const step = ref(2)
</script>

<template>
  <main class="app-shell variant-c">
    <header class="c-header">
      <div class="brand"><span class="brand-mark"><DataLine /></span><strong>Quick Paint</strong></div>
      <el-steps :active="step" finish-status="success" simple>
        <el-step title="Data Source" @click="step = 0" />
        <el-step title="Worksheet" @click="step = 1" />
        <el-step title="Chart Composition" @click="step = 2" />
        <el-step title="Chart Image" @click="step = 3" />
      </el-steps>
      <el-tag effect="plain">本地模式</el-tag>
    </header>

    <section class="c-workspace">
      <div v-if="step === 0" class="focus-stage upload-stage">
        <el-upload drag :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv">
          <el-icon class="upload-icon"><UploadFilled /></el-icon><h2>选择 Data Source</h2><p>拖放 .xlsx 或 .csv 文件到这里</p><el-button type="primary">选择文件</el-button>
        </el-upload>
      </div>
      <div v-else-if="step === 1" class="focus-stage sheet-stage">
        <div class="focus-heading"><div><span>Worksheet</span><h1>选择要制图的数据</h1></div><el-select v-model="compositionState.worksheet"><el-option label="区域销售" value="区域销售" /><el-option label="产品销售" value="产品销售" /></el-select></div>
        <div class="sheet-table"><DataTable /></div>
      </div>
      <div v-else-if="step === 2" class="focus-stage compose-stage">
        <div class="focus-heading"><div><span>Chart Composition</span><h1>组织你的图表</h1></div><p>{{ compositionState.dataSource }} · {{ compositionState.worksheet }}</p></div>
        <div class="compose-grid"><aside><CompositionControls /></aside><div class="compose-preview"><ChartPreview /></div></div>
      </div>
      <div v-else class="focus-stage export-stage">
        <div class="export-review"><ChartPreview /></div>
        <aside><span>Chart Image</span><h1>可以导出了</h1><p>PNG · {{ compositionState.width }} × {{ compositionState.height }} px</p><div class="size-row"><el-input-number v-model="compositionState.width" :step="100" /><span>×</span><el-input-number v-model="compositionState.height" :step="100" /></div><el-button type="primary" size="large"><el-icon><Download /></el-icon>导出 PNG</el-button></aside>
      </div>
    </section>

    <footer class="c-footer">
      <el-button :disabled="step === 0" @click="step--"><el-icon><ArrowLeft /></el-icon>上一步</el-button>
      <span>第 {{ step + 1 }} 步，共 4 步</span>
      <el-button v-if="step < 3" type="primary" @click="step++">继续<el-icon><ArrowRight /></el-icon></el-button>
      <el-button v-else type="primary"><el-icon><Download /></el-icon>导出 PNG</el-button>
    </footer>
  </main>
</template>
