<script setup lang="ts">
import { IconButton } from "@swissgeo/skeleton";
import geoadminLayers from "~/assets/poc/geoadminLayers.json";
import { useGeoadminGeoJsonLoader } from "~/composables/useGeoadminGeoJsonLoader";
import { ref } from "vue";

defineEmits<{ close: [] }>();

const { loadLayer } = useGeoadminGeoJsonLoader();
const selectedLayerId = ref<string>(geoadminLayers[0] ?? "");
const copyLabel = ref("Copy id");

async function copyId(): Promise<void> {
  await navigator.clipboard.writeText(selectedLayerId.value);
  copyLabel.value = "Copied!";
  setTimeout(() => {
    copyLabel.value = "Copy id";
  }, 1500);
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
      chosen styling. Add one at a time; reload to clear.
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
    <div class="mt-3 flex gap-2">
      <UButton @click="loadLayer(selectedLayerId)"> Add (MapLibre) </UButton>
      <UButton @click="loadLayer(selectedLayerId, { legacy: true })">
        Add (legacy)
      </UButton>
      <UButton color="neutral" variant="outline" @click="copyId">
        {{ copyLabel }}
      </UButton>
    </div>
  </div>
</template>
