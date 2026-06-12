<script setup lang="ts">
import { useLayerStore } from "@swissgeo/layers";
import { IconButton } from "@swissgeo/skeleton";
import geoadminLayers from "~/assets/poc/geoadminLayers.json";
import { useGeoadminGeoJsonLoader } from "~/composables/useGeoadminGeoJsonLoader";
import { useMapViewStore } from "~/stores/mapView";
import { ref } from "vue";

defineEmits<{ close: [] }>();

const { loadLayer } = useGeoadminGeoJsonLoader();
const mapViewStore = useMapViewStore();
const layerStore = useLayerStore();
const selectedLayerId = ref<string>(geoadminLayers[0] ?? "");
const copyLabel = ref("Copy id");

async function copyId(): Promise<void> {
  await navigator.clipboard.writeText(selectedLayerId.value);
  copyLabel.value = "Copied!";
  setTimeout(() => {
    copyLabel.value = "Copy id";
  }, 1500);
}

// Add the selected layer twice — MapLibre + legacy — so the compare slider can
// swipe between the two renderings.
async function addBothStyles(): Promise<void> {
  await loadLayer(selectedLayerId.value);
  await loadLayer(selectedLayerId.value, { legacy: true });
}

// Remove all overlay layers but keep the background layer (matched by uuid).
function clearAllLayers(): void {
  const backgroundUuid = layerStore.backgroundLayer?.uuid;
  for (let index = mapViewStore.mapLayers.length - 1; index >= 0; index--) {
    if (mapViewStore.mapLayers[index]?.uuid === backgroundUuid) {
      continue;
    }
    mapViewStore.removeLayer(index);
  }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg font-semibold">Load geoadmin GeoJSON layer (POC)</h3>
      <IconButton @click="$emit('close')" iconName="X" title="Close" />
    </div>
    <p class="mb-2 text-sm text-gray-600">
      Fetches the layer's real data + style from geoadmin, then adds it with the
      chosen styling. "Add (both)" adds MapLibre + legacy so the compare slider
      can swipe between them.
    </p>
    <select
      v-model="selectedLayerId"
      class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      data-testid="debug-geojson-layer-select"
    >
      <option v-for="id in geoadminLayers" :key="id" :value="id">
        {{ id }}
      </option>
    </select>
    <div class="mt-3 flex flex-wrap gap-2">
      <UButton @click="loadLayer(selectedLayerId)"> Add (MapLibre) </UButton>
      <UButton @click="loadLayer(selectedLayerId, { legacy: true })">
        Add (legacy)
      </UButton>
      <UButton @click="addBothStyles"> Add (both) </UButton>
      <UButton color="neutral" variant="outline" @click="copyId">
        {{ copyLabel }}
      </UButton>
      <UButton color="error" variant="outline" @click="clearAllLayers">
        Clear all layers
      </UButton>
    </div>
  </div>
</template>
