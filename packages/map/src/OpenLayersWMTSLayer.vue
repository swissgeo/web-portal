<script lang="ts" setup>
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */
import { computed, onMounted } from "vue";
import useOlWmtsLayer from "./composables/olWmtsLayer.composable";
import type { Options as WMTSOptions } from "ol/source/WMTS";
import { optionsFromCapabilities } from "ol/source/WMTS";

import { getLinksByProtocol } from "@/utils/recordUtils";

import log, { LogLevel } from "@swissgeo/log";

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
  zIndex = -1,
  opacity = 1,
} = defineProps<{
  layer: Record<string, any>; // TODO
  parentLayerOpacity?: number;
  zIndex?: number;
  opacity?: number;
}>();

const capabilitiesRef = computed(() => {
  const links = layer.links;

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
    layer: layer.id,
  });

  if (!options) {
    throw new Error("Unable to get options from capabilities");
  }

  return options;
});

const { setSourceForProjection } = useOlWmtsLayer(
  layer.id,
  layer.uuid,
  await options.value,
  opacity,
  zIndex,
  parentLayerOpacity
);

onMounted(() => {
  setSourceForProjection();
});
</script>

<template>
  <slot />
</template>
