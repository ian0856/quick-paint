<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, DataAnalysis } from '@element-plus/icons-vue'

const props = defineProps<{
  variants: ReadonlyArray<{ key: string; name: string }>
  current: string
  state: object
}>()
const emit = defineEmits<{ change: [key: string] }>()

const index = computed(() => props.variants.findIndex((item) => item.key === props.current))
const currentVariant = computed(() => props.variants[index.value])
const stateJson = computed(() => JSON.stringify(props.state, null, 2))

function cycle(offset: number) {
  const next = (index.value + offset + props.variants.length) % props.variants.length
  emit('change', props.variants[next].key)
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.matches('input, textarea, [contenteditable="true"]')) return
  if (event.key === 'ArrowLeft') cycle(-1)
  if (event.key === 'ArrowRight') cycle(1)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="prototype-switcher" aria-label="原型方案切换器">
    <el-button circle size="small" aria-label="上一个方案" @click="cycle(-1)">
      <el-icon><ArrowLeft /></el-icon>
    </el-button>
    <strong>{{ currentVariant.key }} · {{ currentVariant.name }}</strong>
    <el-button circle size="small" aria-label="下一个方案" @click="cycle(1)">
      <el-icon><ArrowRight /></el-icon>
    </el-button>
    <span class="switcher-divider" />
    <el-popover placement="top" :width="360" trigger="click">
      <template #reference>
        <el-button text class="state-button">
          <el-icon><DataAnalysis /></el-icon>
          状态
        </el-button>
      </template>
      <div class="state-heading">当前完整状态</div>
      <pre class="state-json">{{ stateJson }}</pre>
    </el-popover>
  </div>
</template>
