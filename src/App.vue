<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PrototypeSwitcher from './components/PrototypeSwitcher.vue'
import VariantA from './prototypes/workbench/VariantA.vue'
import VariantB from './prototypes/workbench/VariantB.vue'
import VariantC from './prototypes/workbench/VariantC.vue'
import { compositionState } from './prototypes/workbench/prototypeState'

// PROTOTYPE: Three variants of the single-page chart workbench, switchable via ?variant=A|B|C.
const variants = [
  { key: 'A', name: '三栏工作台' },
  { key: 'B', name: '画布优先' },
  { key: 'C', name: '分步工作区' },
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
