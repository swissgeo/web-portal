<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
import { useToolboxStore } from "@/stores/toolbox";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
</script>

<template>
  <ToolBoxButton
    :title="t('toolbox.share.buttonTitle')"
    :is-disabled="false"
    :is-active="toolboxStore.isPanelActive('share')"
    iconName="share-2"
    @click="toolboxStore.toggleDetailPanel('share')"
  />
</template>
