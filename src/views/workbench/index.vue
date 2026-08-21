<script setup lang="ts">
import { ElDrawer } from 'element-plus'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import ChartSettingsPanel from './_components/ChartSettingsPanel.vue'
import WorkbenchHeader from './_components/WorkbenchHeader.vue'
import WorkbenchSidebar from './_components/WorkbenchSidebar.vue'
import WorkbenchSettingsSidebar from './_components/WorkbenchSettingsSidebar.vue'
import WorkbenchStage from './_components/WorkbenchStage.vue'

const viewportResetRevision = shallowRef(0)
const settingsDrawerOpen = shallowRef(false)
let settingsTrigger: HTMLElement | null = null
let wideViewport: MediaQueryList | null = null

function resetViewport() {
  viewportResetRevision.value += 1
}

function openSettings(trigger: HTMLElement) {
  settingsTrigger = trigger
  settingsDrawerOpen.value = true
}

function restoreSettingsFocus() {
  if (settingsTrigger?.offsetParent !== null) settingsTrigger?.focus()
}

function closeDrawerOnWideViewport(event: MediaQueryListEvent | MediaQueryList) {
  if (event.matches) settingsDrawerOpen.value = false
}

onMounted(() => {
  wideViewport = window.matchMedia('(min-width: 1280px)')
  wideViewport.addEventListener('change', closeDrawerOnWideViewport)
  closeDrawerOnWideViewport(wideViewport)
})

onBeforeUnmount(() => wideViewport?.removeEventListener('change', closeDrawerOnWideViewport))
</script>

<template>
  <div class="h-screen min-h-0 min-w-0 w-full flex flex-col overflow-hidden sm:flex-row">
    <WorkbenchSidebar />
    <div class="min-h-0 min-w-0 flex flex-1 flex-col">
      <WorkbenchHeader
        @reset-viewport="resetViewport"
        @open-settings="openSettings"
      />
      <WorkbenchStage :viewport-reset-revision="viewportResetRevision" />
    </div>
    <WorkbenchSettingsSidebar />
    <ElDrawer
      v-model="settingsDrawerOpen"
      title="高级设置"
      direction="rtl"
      size="min(320px, 100%)"
      append-to-body
      @closed="restoreSettingsFocus"
    >
      <ChartSettingsPanel />
    </ElDrawer>
  </div>
</template>
