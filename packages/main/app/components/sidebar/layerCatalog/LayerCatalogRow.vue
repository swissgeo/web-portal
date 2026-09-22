<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { useDatasetPanelStore } from "@swissgeo/skeleton";
import { useI18n } from "vue-i18n";

const { dataset } = defineProps<{
  dataset: Dataset;
}>();

const { t } = useI18n();
const datasetPanelStore = useDatasetPanelStore();

const { isOnMap, addToMap, removeFromMap } = useDatasetLayer(() => dataset);

const provider = computed(() => {
  const contacts = dataset.properties.contacts ?? [];
  const provider = contacts.find(
    (contact) => contact.role === "resourceProvider",
  );
  if (provider) {
    return provider;
  } else if (contacts.length) {
    return contacts[0];
  }
});

const providerTitleText = computed(() => {
  if (!provider.value) {
    return;
  }
  const { role, organization } = provider.value;
  return role ? `${role}: ${organization}` : organization;
});

function setOnMap(onMap: boolean): void {
  if (onMap) {
    addToMap();
  } else {
    removeFromMap();
  }
}
</script>

<template>
  <div
    role="row"
    class="hover:bg-accent-50 dark:hover:bg-accent-800 col-span-full grid grid-cols-subgrid border-b border-accented last:border-b-0"
    :class="isOnMap ? 'text-highlighted' : 'text-toned'"
  >
    <div
      role="cell"
      class="min-w-0 px-2 py-4"
      :title="dataset.properties.title"
    >
      <USwitch
        data-testid="catalog-layer-on-map"
        size="xs"
        color="accent"
        checked-icon="i-lucide-check"
        :label="dataset.properties.title"
        :description="provider?.organization"
        :ui="{
          wrapper: 'ms-4 min-w-0 text-sm',
          label:
            'cursor-pointer font-bold text-inherit max-md:line-clamp-2 md:truncate',
          // Description is used instead of the `owner` column on mobile, so hidden on desktop
          description: 'line-clamp-2 font-medium text-inherit md:hidden',
        }"
        :model-value="isOnMap"
        @update:model-value="setOnMap"
      />
    </div>
    <div
      role="cell"
      class="hidden truncate px-2 py-4 font-medium md:block"
      :title="providerTitleText"
    >
      {{ provider?.organization }}
    </div>
    <div role="cell" class="py-4 pr-2">
      <UButton
        data-testid="catalog-layer-info"
        icon="i-lucide-info"
        variant="link"
        color="accent"
        class="flex cursor-pointer p-0"
        :title="t('layers.info')"
        :aria-label="t('layers.info')"
        @click="datasetPanelStore.openDatasetPanel(dataset.id)"
      />
    </div>
  </div>
</template>
