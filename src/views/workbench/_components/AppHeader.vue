<script setup lang="ts">
import { DataLine, Download } from '@element-plus/icons-vue'
import { ElButton, ElIcon } from 'element-plus'
</script>

<template>
  <header class="app-header">
    <div class="brand" aria-label="Quick Paint">
      <span class="brand-mark" aria-hidden="true"><DataLine /></span>
      <strong>Quick Paint</strong>
    </div>
    <div class="header-actions">
      <span class="ready-status"><i aria-hidden="true" />Chart Composition 已就绪</span>
      <el-button type="primary">
        <el-icon><Download /></el-icon>
        导出 PNG
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  box-sizing: border-box;
}

.brand,
.header-actions,
.ready-status {
  display: flex;
  align-items: center;
}

.brand {
  gap: 10px;
  color: var(--text-strong);
  font-size: 15px;
}

.brand-mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 6px;
  color: #fff;
  background: var(--primary);
}

.brand-mark :deep(svg) {
  width: 18px;
  height: 18px;
}

.header-actions {
  gap: 16px;
}

.ready-status {
  gap: 7px;
  color: var(--text-muted);
  font-size: 12px;
}

.ready-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}
</style>
