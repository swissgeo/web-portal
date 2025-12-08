<script lang="ts" setup>
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */
import { computed, onMounted } from "vue";
import useOlWmtsLayer from "./composables/olWmtsLayer.composable";
import type { Options as WMTSOptions } from "ol/source/WMTS";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { Feature as OGCFeature } from "@swissgeo/shared/ogc";

import { getLinksByProtocol } from "@/utils/recordUtils";

import log, { LogLevel } from "@swissgeo/log";
import { Layer } from "@swissgeo/layers";

// TODO somehow the statement in main/app.vue doesn't do it
log.wantedLevels = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Warn,
  LogLevel.Error,
];

const {
  layer,
  parentLayerOpacity,
  zIndex = 1,
} = defineProps<{
  layer: Layer;
  zIndex: number;
  parentLayerOpacity?: number;
}>();

/**
 * Extract the capabilities URL from the OGC Record
 */
const capabilitiesRef = computed(() => {
  const links = layer.record.links;

  const link = getLinksByProtocol(links, "OGC:WMTS")[0];
  return {
    url: encodeURIComponent(link.href || link.uriTemplate),
    data: link,
  };
});

/**
 * Retrieve the capabilities and then turn them into
 * a options objects to be used by WMTS
 */
const options = computed(async (): Promise<WMTSOptions> => {
  const { url, data: body } = capabilitiesRef.value;

  // TODO ok here we have a bit of a tight coupling with the main package
  const { data } = await useFetch<string>(`/api/v1/layers/wmtsConfig/${url}`, {
    method: "post",
    body: JSON.stringify(body),
  });

  if (!data.value) {
    log.error(`Unable to fetch capabilities for ${url}`);
    throw new Error();
  }

  const options = optionsFromCapabilities(JSON.parse(data.value), {
    layer: layer.record.id,
  });

  if (!options) {
    throw new Error("Unable to get options from capabilities");
  }

  return options;
});

const { setSourceForProjection, layer: olLayer } = useOlWmtsLayer(
  layer.record.id,
  layer.record.geocatId,
  await options.value,
  layer.opacity,
  zIndex,
  parentLayerOpacity
);

watch(
  () => layer.isVisible,
  (newValue: boolean) => {
    olLayer.setVisible(newValue);
  }
);

onMounted(() => {
  setSourceForProjection();
});
</script>

<template>
  <slot />
</template>
