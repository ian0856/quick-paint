<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PrototypeSwitcher from './components/PrototypeSwitcher.vue'
import VariantA from './prototypes/composition/VariantA.vue'
import VariantB from './prototypes/composition/VariantB.vue'
import VariantC from './prototypes/composition/VariantC.vue'
import { compositionState } from './prototypes/workbench/prototypeState'

// PROTOTYPE: Three Chart Composition editor variants inside the chosen three-column workbench.
const variants = [
  { key: 'A', name: '分组检查器' },
  { key: 'B', name: '分段检查器' },
  { key: 'C', name: '映射画布' },
] as const

const readVariant = () => {
  const candidate = new URLSearchParams(window.location.search).get('variant')?.toUpperCase()
  return variants.some((item) => item.key === candidate) ? candidate! : 'A'
}

const variant = ref(readVariant())
const showPrototypeSwitcher = import.meta.env.DEV
const currentComponent = computed(() => ({ A: VariantA, B: VariantB, C: VariantC })[variant.value])

function setVariant(key: string) {
  variant.value = key
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  window.history.replaceState({}, '', url)
}

function syncVariant() {
  variant.value = readVariant()
}

onMounted(() => window.addEventListener('popstate', syncVariant))
onBeforeUnmount(() => window.removeEventListener('popstate', syncVariant))
</script>

<template>
  <component :is="currentComponent" />
  <PrototypeSwitcher
    v-if="showPrototypeSwitcher"
    :variants="variants"
    :current="variant"
    :state="compositionState"
    @change="setVariant"
  />
</template>
