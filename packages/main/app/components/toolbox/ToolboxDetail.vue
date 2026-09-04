<script setup lang="ts">
import { createReusableTemplate, useMediaQuery } from "@vueuse/core";

import Import from "@/components/toolbox/import/Import.vue";
import ReportIssue from "@/components/toolbox/reportIssue/ReportIssue.vue";
import ToolboxShare from "@/components/toolbox/share/Share.vue";
import { useToolboxStore } from "@/stores/toolbox";

const toolboxStore = useToolboxStore();

const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();
const isDesktop = useMediaQuery("(min-width: 768px)");
</script>

<template>
  <RegisterTemplate>
    <ToolboxShare v-if="toolboxStore.isPanelActive('share')" />
    <Import v-if="toolboxStore.isPanelActive('import')" />
    <ReportIssue v-if="toolboxStore.isPanelActive('reportIssue')" />
  </RegisterTemplate>

  <div
    v-if="toolboxStore.activeDetailPanel && isDesktop"
    class="absolute top-0 right-24 w-96"
  >
    <ReuseTemplate />
  </div>

  <UDrawer
    v-if="toolboxStore.activeDetailPanel && !isDesktop"
    :default-open="true"
    :modal="false"
    @close="toolboxStore.closeDetailPanel()"
  >
    <template #body>
      <ReuseTemplate />
    </template>
  </UDrawer>
</template>
