<script lang="ts" setup>
import { useSidebarStore } from "@swissgeo/skeleton";
import ResponsivePanel from "~/components/sidebar/ResponsivePanel.vue";
import { panelSnapPointKey } from "~/types/injectionKeys";

import FeatureInfo from "./FeatureInfo.vue";

const { isLoading } = defineProps<{ isLoading: boolean }>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

// Only one drawer shows at a time: this one or a map panel
const sidebarStore = useSidebarStore();
sidebarStore.closeSidebar();
watch(
  () => sidebarStore.currentSidebar,
  (sidebar) => {
    if (sidebar) {
      emit("close");
    }
  },
);

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
      v-if="isLoading"
      role="status"
      class="px-4 py-3 text-sm text-muted"
      data-testid="feature-info-loading"
    >
      {{ t("featureInfo.loading") }}
    </p>
    <FeatureInfo v-else isStacked />
  </ResponsivePanel>
</template>
