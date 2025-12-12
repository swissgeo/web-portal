<script lang="ts" setup>
import type { Options as WMTSOptions } from "ol/source/WMTS";

import { Layer } from "@swissgeo/layers";
import log, { LogLevel } from "@swissgeo/log";
import { optionsFromCapabilities } from "ol/source/WMTS";
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */
import { computed, onMounted } from "vue";

import { getLinksByProtocol } from "@/utils/recordUtils";

import useOlWmtsLayer from "./composables/olWmtsLayer.composable";

// TODO somehow the statement in main/app.vue doesn't do it
log.wantedLevels = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Warn,
  LogLevel.Error,
];

const { layer, zIndex = 1 } = defineProps<{
  layer: Layer;
  zIndex: number;
}>();

/**
 * Extract the capabilities URL from the OGC Record
 */
const capabilityUrl = computed(() => {
  const links = layer.record.links;

  const link = getLinksByProtocol(links, "OGC:WMTS")[0];
  const href = link.href || link.uriTemplate;

  if (!href) {
    throw new Error(
      `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`,
    );
  }
  return encodeURIComponent(href);
});

// TODO ok here we have a bit of a tight coupling with the main package
const { data } = await useFetch<string>(
  `/api/v1/layers/wmtsConfig/${capabilityUrl.value}`,
);

/**
 * Retrieve the capabilities and then turn them into
 * a options objects to be used by WMTS
 */
const options = computed((): WMTSOptions => {
  if (!data.value) {
    log.error(`Unable to fetch capabilities for ${url.value}`);
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
  options.value,
  layer.opacity,
  zIndex,
);

watch(
  () => layer.isVisible,
  (newValue: boolean) => {
    olLayer.setVisible(newValue);
  },
);

onMounted(() => {
  setSourceForProjection();
});
</script>

<template>
  <slot />
</template>
