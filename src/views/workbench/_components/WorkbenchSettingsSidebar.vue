<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElIcon, ElTooltip } from 'element-plus'
import { shallowRef } from 'vue'
import ChartSettingsPanel from './ChartSettingsPanel.vue'

const isCollapsed = shallowRef(false)
</script>

<template>
  <aside
    class="settings-sidebar hidden h-screen flex-none flex-col overflow-hidden border-l border-base bg-base xl:flex"
    :class="{ 'settings-sidebar--collapsed': isCollapsed }"
    aria-label="高级设置侧边栏"
  >
    <div class="relative h-15 min-w-0 flex flex-none items-center border-b border-base px-5">
      <Transition name="settings-content">
        <h2 v-show="!isCollapsed" class="m-0 text-sm font-600 text-text-strong">高级设置</h2>
      </Transition>
      <ElTooltip :content="isCollapsed ? '展开高级设置' : '折叠高级设置'" placement="left">
        <span class="absolute right-2 top-2.5 inline-flex">
          <button
            class="focus-ring h-10 w-10 inline-flex cursor-pointer items-center justify-center  text-text "
            type="button"
            :aria-label="isCollapsed ? '展开高级设置' : '折叠高级设置'"
            :aria-expanded="!isCollapsed"
            aria-controls="workbench-settings-panel"
            @click="isCollapsed = !isCollapsed"
          >
            <ElIcon>
              <ArrowLeft v-if="isCollapsed" />
              <ArrowRight v-else />
            </ElIcon>
          </button>
        </span>
      </ElTooltip>
    </div>
    <Transition name="settings-content">
      <ChartSettingsPanel id="workbench-settings-panel" v-show="!isCollapsed" />
    </Transition>
  </aside>
</template>

<style scoped>
.settings-sidebar {
  width: 36rem;
  transition: width 200ms cubic-bezier(0.2, 0, 0, 1);
}

.settings-sidebar--collapsed {
  width: 3.5rem;
}

.settings-content-enter-active,
.settings-content-leave-active {
  transition: opacity 140ms ease, transform 140ms cubic-bezier(0.2, 0, 0, 1);
}

.settings-content-enter-from,
.settings-content-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (prefers-reduced-motion: reduce) {
  .settings-sidebar,
  .settings-content-enter-active,
  .settings-content-leave-active {
    transition: none;
  }
}
</style>
