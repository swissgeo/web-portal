<script lang="ts" setup>
import { useFeaturesStore } from "@swissgeo/feature";
import ResponsivePanel from "~/components/sidebar/ResponsivePanel.vue";
import { panelSnapPointKey } from "~/types/injectionKeys";

import FeatureInfo from "./FeatureInfo.vue";

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const featureStore = useFeaturesStore();

// The drawer always opens at its own height, also after a panel was full height
const panelSnapPoint = inject(panelSnapPointKey, ref(null));
panelSnapPoint.value = null;
</script>

<template>
  <ResponsivePanel
    :title="t('featureInfo.popupTitle')"
    :closeLabel="t('featureInfo.close')"
    :expandLabel="t('featureInfo.expand')"
    :collapseLabel="t('featureInfo.collapse')"
    hasCloseButton
    @close="emit('close')"
  >
    <p
      v-if="featureStore.isLoading"
      role="status"
      class="px-4 py-3 text-sm text-muted"
      data-testid="feature-info-loading"
    >
      {{ t("featureInfo.loading") }}
    </p>
    <FeatureInfo v-else isStacked />
  </ResponsivePanel>
</template>
