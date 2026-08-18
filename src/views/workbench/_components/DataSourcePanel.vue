<script setup lang="ts">
import { FolderOpened, RefreshRight } from '@element-plus/icons-vue'
import { ElButton, ElIcon, ElOption, ElSelect, ElTag } from 'element-plus'
import { shallowRef } from 'vue'

defineProps<{ compositionReady: boolean }>()

const worksheet = shallowRef('区域销售')

const fields = [
  { name: '月份', kind: '文', detail: '文本 · 无缺失', tone: 'text' },
  { name: '华东', kind: '数', detail: '数字 · 无缺失', tone: 'number' },
  { name: '华南', kind: '数', detail: '数字 · 无缺失', tone: 'number' },
  { name: '华西', kind: '数', detail: '数字 · 1 个缺失', tone: 'warning' },
] as const
</script>

<template>
  <aside class="source-panel" aria-label="Data Source">
    <div class="panel-heading">
      <span class="panel-title">Data Source</span>
      <ElTag size="small" type="success" effect="light">就绪</ElTag>
    </div>

    <button class="source-file" type="button">
      <ElIcon><FolderOpened /></ElIcon>
      <span class="source-file-copy">
        <strong class="source-file-name">2026 上半年区域销售.xlsx</strong>
        <small class="source-file-meta">248 KB · 本地文件</small>
      </span>
    </button>

    <label class="field-label" for="worksheet-select">Worksheet</label>
    <ElSelect id="worksheet-select" v-model="worksheet" aria-label="Worksheet">
      <ElOption label="区域销售" value="区域销售" />
      <ElOption label="产品销售" value="产品销售" />
    </ElSelect>

    <div class="source-meta">
      <span class="meta-item"><strong class="meta-value">6</strong> 条 Record</span>
      <span class="meta-item"><strong class="meta-value">7</strong> 个 Field</span>
    </div>

    <ElButton class="replace-button" text>
      <ElIcon><RefreshRight /></ElIcon>
      更换 Data Source
    </ElButton>

    <div class="flow-section">
      <div class="field-section-heading">
        <span class="section-label">制图流程</span>
        <small class="section-count">2 / 3</small>
      </div>
      <ol class="flow-list">
        <li class="flow-item is-complete">
          <i class="flow-marker">✓</i><span class="flow-label">选择数据</span>
        </li>
        <li class="flow-item" :class="{ 'is-complete': compositionReady }">
          <i class="flow-marker">{{ compositionReady ? '✓' : '2' }}</i>
          <span class="flow-label">配置图表</span>
        </li>
        <li class="flow-item is-current">
          <i class="flow-marker">3</i><span class="flow-label">导出图片</span>
        </li>
      </ol>
    </div>

    <div class="field-section-heading">
      <span class="section-label">Field Profile</span>
      <small class="section-count">4 / 7</small>
    </div>
    <ul class="field-list">
      <li v-for="field in fields" :key="field.name">
        <i :class="`field-kind field-kind--${field.tone}`">{{ field.kind }}</i>
        <span class="field-copy">
          <strong class="field-name">{{ field.name }}</strong>
          <small class="field-detail">{{ field.detail }}</small>
        </span>
      </li>
    </ul>

    <div class="privacy-note">
      <span class="privacy-check" aria-hidden="true">✓</span>
      数据仅在当前浏览器中处理
    </div>
  </aside>
</template>

<style scoped>
.source-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-right: 1px solid var(--border);
  background: var(--surface);
  box-sizing: border-box;
  overflow: auto;
}

.panel-heading,
.field-section-heading,
.source-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-heading,
.field-section-heading {
  color: var(--text-strong);
  font-size: 12px;
  font-weight: 700;
}

.source-file {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 62px;
  padding: 10px;
  text-align: left;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  color: var(--text);
  background: var(--surface);
  cursor: pointer;
}

.source-file:hover,
.source-file:focus-visible {
  border-color: var(--primary);
}

.source-file:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.source-file .el-icon {
  flex: 0 0 auto;
  color: var(--primary);
  font-size: 22px;
}

.source-file-copy,
.field-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.source-file-name {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-file-meta,
.field-detail,
.section-count {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 400;
}

.field-label {
  margin-bottom: -8px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.source-meta {
  padding: 9px 10px;
  border-radius: 5px;
  color: var(--text-muted);
  background: var(--surface-subtle);
  font-size: 10px;
}

.meta-value {
  color: var(--text-strong);
  font-size: 12px;
}

.replace-button {
  align-self: flex-start;
  margin-top: -6px;
}

.field-section-heading {
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.field-list > li {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 7px;
  border-radius: 5px;
}

.field-list > li:hover {
  background: var(--surface-subtle);
}

.field-name {
  color: var(--text);
  font-size: 11px;
}

.field-kind {
  display: grid;
  flex: 0 0 25px;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 4px;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
}

.field-kind--text {
  color: #3158a7;
  background: #edf3ff;
}

.field-kind--number {
  color: #18724d;
  background: #eaf8f1;
}

.field-kind--warning {
  color: #94620a;
  background: #fff5dc;
}

.privacy-note {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
}

.privacy-check {
  color: var(--success);
  font-weight: 700;
}

.flow-section {
  padding-top: 2px;
}

.flow-list {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.flow-item {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--text-muted);
  font-size: 10px;
}

.flow-marker {
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
}

.flow-item.is-complete .flow-marker {
  border-color: #bce6d2;
  color: #18724d;
  background: #eaf8f1;
}

.flow-item.is-current .flow-marker {
  border-color: var(--primary);
  color: var(--primary);
  background: #edf3ff;
}

.flow-item.is-current .flow-label {
  color: var(--text-strong);
  font-weight: 600;
}
</style>
