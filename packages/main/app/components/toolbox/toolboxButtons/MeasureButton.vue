<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
</script>

<template>
  <div>
    <ToolBoxButton
      :title="t('toolbox.measure.buttonTitle')"
      :is-disabled="false"
      :is-active="false"
      iconName="ruler"
    />
  </div>
</template>

<style scoped></style>
