<script lang="ts" setup>
import type {
  Feature as OGCFeature,
  Link as OGCLink,
} from "@swissgeo/shared/ogc";

import { makeLayer, useLayerStore, LayerType } from "@swissgeo/layers";
import { MapModule } from "@swissgeo/map";

const layersStore = useLayerStore();

const layers = await $fetch("/api/v1/layers/records");

const availableLayers = ref<OGCFeature[]>([]);

onMounted(async () => {
  availableLayers.value.push(
    ...layers.features.filter((layer: OGCFeature) => {
      const wmts = layer.links.filter(
        (link: OGCLink) => link.protocol === "OGC:WMTS",
      );

      return wmts.length > 0;
    }),
  );
});

function addLayerToMap(layer: OGCFeature) {
  layersStore.addLayer(makeLayer(layer));
}
</script>

<template>
    <ClientOnly>
        <MapModule class="h-screen w-full" />
        <div
            class="fixed right-0 bottom-0 z-3 h-[300px] w-[800px] overflow-scroll bg-white shadow"
        >
            <ul>
                <li v-for="layer in availableLayers" class="hover:bg-amber-300">
                    <button class="cursor-pointer" @click="addLayerToMap(layer)">
                        {{ layer.id }} (WMTS)
                    </button>
                </li>
            </ul>
        </div>
    </ClientOnly>
</template>
