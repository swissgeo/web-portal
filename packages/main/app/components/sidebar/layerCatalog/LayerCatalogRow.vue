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

async function setOnMap(onMap: boolean): Promise<void> {
  if (onMap) {
    await addToMap();
  } else {
    removeFromMap();
  }
}
</script>

<template>
  <tr
    class="hover:bg-accent-50 dark:hover:bg-accent-800 border-b border-accented align-top last:border-b-0"
    :class="isOnMap ? 'text-highlighted' : 'text-toned'"
  >
    <td class="px-2 py-4" :title="dataset.properties.title">
      <USwitch
        data-testid="catalog-layer-on-map"
        size="xs"
        color="accent"
        checked-icon="i-lucide-check"
        :label="dataset.properties.title"
        :ui="{
          wrapper: 'ms-4 min-w-0 text-sm',
          label: 'cursor-pointer truncate font-bold text-inherit',
        }"
        :model-value="isOnMap"
        @update:model-value="setOnMap"
      />
    </td>
    <td class="truncate px-2 py-4 font-medium" :title="providerTitleText">
      {{ provider?.organization }}
    </td>
    <td class="py-4 pr-2">
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
    </td>
  </tr>
</template>
