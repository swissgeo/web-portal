<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const { t } = useI18n();
const mapViewStore = useMapViewStore();
</script>

<template>
  <div>
    <ToolBoxButton
      :title="t('toolbox.compare.buttonTitle')"
      :is-active="mapViewStore.isCompareSliderActive"
      :is-disabled="false"
      iconName="square-split-horizontal"
      @click="mapViewStore.toggleCompareSlider()"
    />
  </div>
</template>
