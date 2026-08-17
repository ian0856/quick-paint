<script setup lang="ts">
import { computed, ref } from 'vue'
import { DataLine, Download, FolderOpened, UploadFilled } from '@element-plus/icons-vue'
import ChartPreview from '../workbench/ChartPreview.vue'
import DataTable from '../workbench/DataTable.vue'
import { acceptPrototypeFile, compositionState } from '../workbench/prototypeState'

defineProps<{ editorName: string }>()
const centerView = ref('preview')
const canExport = computed(() => Boolean(compositionState.categoryField && compositionState.seriesFields.length))
</script>

<template>
  <main class="app-shell composition-prototype">
    <header class="app-header">
      <div class="brand"><span class="brand-mark"><DataLine /></span><strong>Quick Paint</strong></div>
      <div class="header-actions">
        <span class="save-status">{{ canExport ? 'Chart Composition 已就绪' : '字段映射未完成' }}</span>
        <el-button type="primary" :disabled="!canExport"><el-icon><Download /></el-icon>导出 PNG</el-button>
      </div>
    </header>
    <div class="composition-workspace">
      <aside class="source-panel">
        <div class="panel-heading"><span>Data Source</span><el-tag size="small" type="success">就绪</el-tag></div>
        <el-upload :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv">
          <el-button class="source-file" plain><el-icon><FolderOpened /></el-icon><span><strong>{{ compositionState.dataSource }}</strong><small>248 KB · 本地文件</small></span></el-button>
        </el-upload>
        <label>Worksheet</label>
        <el-select v-model="compositionState.worksheet"><el-option label="区域销售" value="区域销售" /><el-option label="产品销售" value="产品销售" /></el-select>
        <div class="source-meta"><span>6 条 Record</span><span>7 个 Field</span></div>
        <el-upload :before-upload="acceptPrototypeFile" :show-file-list="false" accept=".xlsx,.csv">
          <el-button text><el-icon><UploadFilled /></el-icon>更换 Data Source</el-button>
        </el-upload>
        <div class="field-profile-list">
          <div><i class="type-text">文</i><span><strong>月份</strong><small>文本 · 无缺失</small></span></div>
          <div><i class="type-number">数</i><span><strong>华东</strong><small>数字 · 无缺失</small></span></div>
          <div><i class="type-number">数</i><span><strong>华南</strong><small>数字 · 无缺失</small></span></div>
          <div><i class="type-warning">数</i><span><strong>华西</strong><small>数字 · 1 个缺失</small></span></div>
        </div>
      </aside>

      <section class="composition-center">
        <div class="view-toolbar">
          <el-segmented v-model="centerView" :options="[{ label: '图表预览', value: 'preview' }, { label: '数据预览', value: 'data' }]" />
          <span>{{ compositionState.width }} × {{ compositionState.height }} px</span>
        </div>
        <div class="composition-stage">
          <ChartPreview v-if="centerView === 'preview'" />
          <DataTable v-else />
        </div>
      </section>

      <aside class="composition-editor-panel">
        <div class="editor-heading"><div><span>Chart Composition</span><small>{{ editorName }}</small></div><el-tag size="small" :type="canExport ? 'success' : 'warning'">{{ canExport ? '有效' : '未完成' }}</el-tag></div>
        <slot />
      </aside>
    </div>
  </main>
</template>
