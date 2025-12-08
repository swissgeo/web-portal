<script lang="ts" setup>
import type {
  Link as OGCLink,
  Feature as OGCFeature,
} from "@swissgeo/shared/ogc";

import { makeLayer, LayerType, useLayerStore } from "@swissgeo/layers";

const layerStore = useLayerStore();

// const { layers } = defineProps<{ layers: OGCFeature[] }>();

// const layersToDisplay = computed(() => {
//   if (!layers) {
//     return [];
//   }

//   const wmtsLayers = layers.filter((layer: OGCFeature) => {
//     const wmts = layer.links.filter(
//       (link: OGCLink) => link.protocol === "OGC:WMTS"
//     );

//     return wmts.length > 0;
//   });

//   return [makeLayer(wmtsLayers[0], LayerType.WMTS)];
// });
</script>

<template>
  <div>
    <div></div>
    <!-- here's the switch between openlayers and cesium -->
    <OpenLayersMap>
      <slot />
    </OpenLayersMap>
  </div>
</template>
