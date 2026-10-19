<script setup lang="ts">
import ResponsivePanel from "~/components/sidebar/ResponsivePanel.vue";
import { panelSnapPointKey } from "~/types/injectionKeys";
import { useI18n } from "vue-i18n";

const { isVisible } = defineProps<{ isVisible: boolean }>();
const { t } = useI18n();

const FULL_HEIGHT_SNAP_POINT = 1;

// Each detail opens at full height. After it closes, the map panel opens at its middle height.
const panelSnapPoint = inject(panelSnapPointKey, ref(null));
watch(
  () => isVisible,
  (visible) => {
    panelSnapPoint.value = visible ? FULL_HEIGHT_SNAP_POINT : null;
  },
  { immediate: true },
);
</script>

<template>
  <!-- Keep the route outlet mounted while navigation resolves. -->
  <div
    v-show="isVisible"
    class="md:absolute md:inset-y-0 md:left-0 md:z-60 md:flex md:w-3/4 md:max-w-dataset-panel md:flex-col"
  >
    <ClientOnly>
      <ResponsivePanel
        :title="t('dataset.details')"
        :closeLabel="t('dataset.close')"
        :expandLabel="t('dataset.expandPanel')"
        :collapseLabel="t('dataset.collapsePanel')"
        :hasHeader="false"
        :isVisible="isVisible"
        :isDismissible="false"
      >
        <slot />
      </ResponsivePanel>
      <!-- ClientOnly shows this until it is mounted, because UDrawer renders nothing
           on the server. The route outlet lets the dataset page set its title, meta and 404. -->
      <template #fallback>
        <slot />
      </template>
    </ClientOnly>
  </div>
</template>
