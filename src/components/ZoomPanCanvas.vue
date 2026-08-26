<script setup lang="ts">
import Panzoom from '@panzoom/panzoom'
import type { PanzoomGlobalOptions, PanzoomObject } from '@panzoom/panzoom'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

const props = withDefaults(defineProps<{
  ariaLabel?: string
  minScale?: number
  maxScale?: number
  step?: number
}>(), {
  ariaLabel: '可缩放画布',
  minScale: 0.5,
  maxScale: 2.5,
  step: 0.15,
})

const viewport = useTemplateRef<HTMLDivElement>('viewport')
const content = useTemplateRef<HTMLDivElement>('content')
let panzoom: PanzoomObject | null = null

function panzoomOptions(): PanzoomGlobalOptions {
  return {
    minScale: props.minScale,
    maxScale: props.maxScale,
    step: props.step,
    cursor: 'grab',
    overflow: 'hidden',
  }
}

function onWheel(event: WheelEvent) {
  if (!event.ctrlKey || !panzoom) return
  event.preventDefault()
  panzoom.zoomWithWheel(event)
}

function reset() {
  panzoom?.reset({ animate: false })
}

onMounted(() => {
  if (!viewport.value || !content.value) return
  panzoom = Panzoom(content.value, panzoomOptions())
  viewport.value.addEventListener('wheel', onWheel, { passive: false })
})

watch(() => [props.minScale, props.maxScale, props.step], () => {
  panzoom?.setOptions(panzoomOptions())
})

onBeforeUnmount(() => {
  viewport.value?.removeEventListener('wheel', onWheel)
  panzoom?.destroy()
  panzoom = null
})

defineExpose({ reset })
</script>

<template>
  <div
    ref="viewport"
    class="zoom-pan-viewport h-full min-h-0 min-w-0 w-full overflow-hidden"
    role="region"
    :aria-label="ariaLabel"
  >
    <div ref="content" class="zoom-pan-content h-max w-max" data-zoom-pan-content>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.zoom-pan-content {
  transform-origin: 50% 50%;
}

.zoom-pan-content:active {
  cursor: grabbing !important;
}
</style>
