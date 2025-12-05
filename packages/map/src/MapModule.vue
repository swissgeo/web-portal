<script lang="ts" setup>
import type {
  Link as OGCLink,
  Feature as OGCFeature,
} from "@swissgeo/shared/ogc";

const { layers } = defineProps<{ layers: OGCFeature[] }>();

const layersToDisplay = computed(() => {
  if (!layers) {
    return [];
  }

  const wmtsLayers = layers.filter((layer: OGCFeature) => {
    const wmts = layer.links.filter(
      (link: OGCLink) => link.protocol === "OGC:WMTS",
    );

    return wmts.length > 0;
  });

  return [wmtsLayers[0]];
});
</script>

<template>
  <div>
    <!-- here's the switch between openlayers and cesium -->
    <OpenLayersMap :layers="layersToDisplay">
      <slot />
    </OpenLayersMap>
  </div>
</template>
