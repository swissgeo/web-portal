<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { useDimensionsStore } from "@swissgeo/dimension";
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const toast = useToast();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();

const query = ref("");

const { data, hasMore, status, error, loadMore } = useOgcCatalog(locale, query);

const datasets = computed<Dataset[]>(() => data.value?.features ?? []);

/**
 * The organization of the contact holding the `pointOfContact` role, which is
 * the record's data owner. A record does not have to name one.
 */
function dataOwnerOf(dataset: Dataset): string | undefined {
  return dataset.properties.contacts?.find(
    (contact) => contact.role === "pointOfContact",
  )?.organization;
}

/**
 * The layer a row stands for once it is on the map. Layers are matched on the
 * record id they were made from, which is what a row is keyed on.
 */
function mapLayerOf(layerId: string) {
  return layerStore.layers.find((layer) => layer.humanId === layerId);
}

/**
 * Puts the layer on the map, or takes it back off.
 *
 * TODO: check whether this can be shared with LayerCartEntry.vue, which adds
 * and removes the very same layers from the cart side.
 */
function setOnMap(dataset: Dataset, onMap: boolean): void {
  if (!onMap) {
    const layer = mapLayerOf(dataset.id);
    if (layer) {
      dimensionsStore.clearLayerDimensions(layer.uuid);
      // Removing the source layer unmounts its converter. The converter then
      // removes the matching layer from the map-view store.
      layerStore.removeLayer(layer.uuid);
    }
    return;
  }
  try {
    layerStore.addLayer(makeServerLayer(dataset));
  } catch (e) {
    log.error(
      "Failed to add catalog layer to map",
      e instanceof Error ? e : new Error(String(e)),
    );
    toast.add({ color: "error", title: t("dataset.addToMapError") });
  }
}
</script>

<template>
  <div class="min-w-0 flex-1 overflow-y-auto p-4">
    <UInput
      v-model="query"
      icon="i-lucide-search"
      :placeholder="t('layerCatalog.searchPlaceholder')"
      size="sm"
      variant="outline"
      class="mb-3 w-full"
      data-testid="catalog-search-input"
    />
    <p v-if="error" class="text-sm text-error">
      {{ t("layerCatalog.error") }}
    </p>
    <p
      v-else-if="datasets.length === 0 && status !== 'pending'"
      class="text-sm text-muted"
    >
      {{ t("layerCatalog.table.empty") }}
    </p>
    <table v-else class="w-full text-left text-sm">
      <thead class="border-b border-gray-200">
        <tr>
          <th class="w-10 px-3 py-2 font-semibold">
            <span class="sr-only">{{ t("layerCatalog.table.onMap") }}</span>
          </th>
          <th class="px-3 py-2 font-semibold">
            {{ t("layerCatalog.table.title") }}
          </th>
          <th class="px-3 py-2 font-semibold">
            {{ t("layerCatalog.table.dataOwner") }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="dataset in datasets"
          :key="dataset.id"
          class="border-b border-gray-100"
        >
          <td class="px-3 py-2">
            <USwitch
              data-testid="catalog-layer-on-map"
              :model-value="!!mapLayerOf(dataset.id)"
              :aria-label="
                mapLayerOf(dataset.id)
                  ? t('layers.remove')
                  : t('dataset.addToMap')
              "
              @update:model-value="setOnMap(dataset, $event)"
            />
          </td>
          <td class="px-3 py-2">{{ dataset.properties.title }}</td>
          <td class="px-3 py-2">{{ dataOwnerOf(dataset) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-if="status === 'pending'" class="px-3 py-2 text-sm text-muted">
      {{ t("layerCatalog.loading") }}
    </p>
    <UButton
      v-else-if="hasMore"
      color="neutral"
      variant="subtle"
      size="sm"
      class="mt-2 cursor-pointer"
      @click="loadMore"
    >
      {{ t("layerCatalog.loadMore") }}
    </UButton>
  </div>
</template>
