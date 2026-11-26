<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";

import ResponsivePanel from "@/components/sidebar/ResponsivePanel.vue";
import Drawing from "@/components/toolbox/drawing/drawing.vue";
import Import from "@/components/toolbox/import/Import.vue";
import ToolboxShare from "@/components/toolbox/share/Share.vue";
import { useToolboxStore } from "@/stores/toolbox";

const toolboxStore = useToolboxStore();
const { t } = useI18n();

const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();
const isDesktop = useIsDesktop();
</script>

<template>
  <RegisterTemplate>
    <ToolboxShare v-if="toolboxStore.isPanelActive('share')" />
    <Import v-if="toolboxStore.isPanelActive('import')" />
    <Drawing v-if="toolboxStore.isPanelActive('drawing')" />
  </RegisterTemplate>

  <div
    v-if="toolboxStore.activeDetailPanel && isDesktop"
    class="absolute top-0 right-24 w-96"
    :class="
      toolboxStore.isPanelActive('drawing') ? 'flex max-h-full flex-col' : ''
    "
  >
    <ReuseTemplate />
  </div>

  <ResponsivePanel
    v-if="toolboxStore.activeDetailPanel && !isDesktop"
    :title="t(`toolbox.${toolboxStore.activeDetailPanel}.title`)"
    :closeLabel="t('toolbox.mobileDrawer.close')"
    :expandLabel="t('toolbox.mobileDrawer.expand')"
    :collapseLabel="t('toolbox.mobileDrawer.collapse')"
    :hasHeader="false"
    :hasOwnScroller="toolboxStore.isPanelActive('drawing')"
    @close="toolboxStore.closeDetailPanel()"
  >
    <ReuseTemplate />
  </ResponsivePanel>
</template>
