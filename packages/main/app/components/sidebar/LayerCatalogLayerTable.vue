<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { useDimensionsStore } from "@swissgeo/dimension";
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { useI18n } from "vue-i18n";

import type { LayerRecord } from "@/components/sidebar/useLayerRecords";

/**
 * The records to list. Props are shallow, so the records keep the state refs
 * they were built with rather than having them unwrapped by deep reactivity.
 */
const props = defineProps<{ layers: LayerRecord[] }>();

const { t } = useI18n();
const toast = useToast();
const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();

type LayerRow = {
  layerId: string;
  title: string;
  description?: string;
  /** The dataset the layer is made from, missing until its record has landed. */
  dataset?: Dataset;
  /** The organization the record names as its point of contact. */
  dataOwner?: string;
};

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
 * A row per selected layer: a record only knows its title once it has been
 * fetched, so the title stands in for it while it is on its way or has failed.
 */
const rows = computed<LayerRow[]>(() =>
  props.layers.map(({ layerId, state }) => {
    const recordState = state.value;
    switch (recordState.status) {
      case "success":
        return {
          layerId,
          title: recordState.dataset.properties.title,
          description: recordState.dataset.properties.description,
          dataset: recordState.dataset,
          dataOwner: dataOwnerOf(recordState.dataset),
        };
      case "error":
        return { layerId, title: t("layerCatalog.titleError") };
      case "idle":
      case "pending":
        return { layerId, title: t("layerCatalog.titleLoading") };
    }
  }),
);

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
function setOnMap(row: LayerRow, onMap: boolean): void {
  if (!onMap) {
    const layer = mapLayerOf(row.layerId);
    if (layer) {
      dimensionsStore.clearLayerDimensions(layer.uuid);
      // Removing the source layer unmounts its converter. The converter then
      // removes the matching layer from the map-view store.
      layerStore.removeLayer(layer.uuid);
    }
    return;
  }
  if (!row.dataset) {
    return;
  }
  try {
    layerStore.addLayer(makeServerLayer(row.dataset));
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
    <p v-if="rows.length === 0" class="text-sm text-muted">
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
          v-for="row in rows"
          :key="row.layerId"
          class="border-b border-gray-100"
        >
          <td class="px-3 py-2">
            <!-- A layer can only be put on the map once its record is there -->
            <USwitch
              data-testid="catalog-layer-on-map"
              :model-value="!!mapLayerOf(row.layerId)"
              :disabled="!row.dataset"
              :aria-label="
                mapLayerOf(row.layerId)
                  ? t('layers.remove')
                  : t('dataset.addToMap')
              "
              @update:model-value="setOnMap(row, $event)"
            />
          </td>
          <td class="px-3 py-2">{{ row.title }}</td>
          <td class="px-3 py-2">{{ row.dataOwner }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
