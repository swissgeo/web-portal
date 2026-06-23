<script setup lang="ts">
import { useLayerStore } from "@swissgeo/layers";
import { IconButton } from "@swissgeo/skeleton";
import geoadminLayers from "~/assets/poc/geoadminLayers.json";
import { useGeoadminGeoJsonLoader } from "~/composables/useGeoadminGeoJsonLoader";
import { useMapViewStore } from "~/stores/mapView";
import { computed, ref } from "vue";

defineEmits<{ close: [] }>();

const { loadLayer, fetchStyles } = useGeoadminGeoJsonLoader();
const mapViewStore = useMapViewStore();
const layerStore = useLayerStore();
const selectedLayerId = ref<string>(geoadminLayers[0] ?? "");
const copyLabel = ref("Copy id");

const isStyleModalOpen = ref(false);
const isLoadingStyle = ref(false);
const geoadminStyleJson = ref("");
const mapLibreStyleJson = ref("");
// Layer whose style is shown in the modal. Independent of the panel select so the
// in-modal dropdown can switch styles without touching the panel selection.
const styleLayerId = ref<string>(geoadminLayers[0] ?? "");

// Fetch a layer's style and show both the raw geoadmin style and the converted
// MapLibre style, without adding a layer to the map.
async function loadStyle(layerId: string): Promise<void> {
  if (!layerId) {
    return;
  }
  isLoadingStyle.value = true;
  geoadminStyleJson.value = "";
  mapLibreStyleJson.value = "";
  try {
    const { geoadminStyle, mapLibreStyle } = await fetchStyles(layerId);
    geoadminStyleJson.value = JSON.stringify(geoadminStyle, null, 2);
    mapLibreStyleJson.value = JSON.stringify(mapLibreStyle, null, 2);
  } catch (error) {
    geoadminStyleJson.value = `Failed to load style: ${String(error)}`;
  } finally {
    isLoadingStyle.value = false;
  }
}

const geoadminStyleLines = computed(() => geoadminStyleJson.value.split("\n"));
const mapLibreStyleLines = computed(() => mapLibreStyleJson.value.split("\n"));

// Open the modal for the currently selected panel layer.
async function showStyle(): Promise<void> {
  styleLayerId.value = selectedLayerId.value;
  isStyleModalOpen.value = true;
  await loadStyle(styleLayerId.value);
}

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
      <UButton color="neutral" variant="outline" @click="showStyle">
        Show style
      </UButton>
      <UButton color="neutral" variant="outline" @click="copyId">
        {{ copyLabel }}
      </UButton>
      <UButton color="error" variant="outline" @click="clearAllLayers">
        Clear all layers
      </UButton>
    </div>

    <UModal
      v-model:open="isStyleModalOpen"
      :title="`Style — ${styleLayerId}`"
      :ui="{ content: 'max-w-[95vw] sm:max-w-[95vw]' }"
    >
      <template #body>
        <select
          v-model="styleLayerId"
          @change="loadStyle(styleLayerId)"
          class="mb-3 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          data-testid="debug-geojson-style-select"
        >
          <option v-for="id in geoadminLayers" :key="id" :value="id">
            {{ id }}
          </option>
        </select>
        <div v-if="isLoadingStyle" class="text-sm text-gray-600">
          Loading style…
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="mb-1 text-sm font-semibold">Geoadmin style (original)</h4>
            <div
              class="max-h-[70vh] overflow-auto rounded bg-gray-100 font-mono text-xs"
            >
              <div
                v-for="(line, index) in geoadminStyleLines"
                :key="index"
                class="flex"
              >
                <span
                  class="w-10 shrink-0 select-none border-r border-gray-300 px-2 text-right text-gray-400"
                >
                  {{ index + 1 }}
                </span>
                <pre class="whitespace-pre px-2">{{ line }}</pre>
              </div>
            </div>
          </div>
          <div>
            <h4 class="mb-1 text-sm font-semibold">MapLibre style (converted)</h4>
            <div
              class="max-h-[70vh] overflow-auto rounded bg-gray-100 font-mono text-xs"
            >
              <div
                v-for="(line, index) in mapLibreStyleLines"
                :key="index"
                class="flex"
              >
                <span
                  class="w-10 shrink-0 select-none border-r border-gray-300 px-2 text-right text-gray-400"
                >
                  {{ index + 1 }}
                </span>
                <pre class="whitespace-pre px-2">{{ line }}</pre>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
