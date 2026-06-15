<script setup lang="ts">
import type { Dataset } from "@swissgeo/ogc";

import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import { IconButton } from "@swissgeo/skeleton";
import WMSCapabilities from "ol/format/WMSCapabilities";
import WMTSCapabilities from "ol/format/WMTSCapabilities";

const layerStore = useLayerStore();

// Example URLs:
// WMTS: https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml
// WMS: https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
const importUrl = ref("https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml");
const layers: Ref<string[]> = ref([]);
const currentLayerType: Ref<string | null> = ref(null);

const encodedUrl = computed(() => encodeURIComponent(importUrl.value));

async function loadCapabilities() {
  if (importUrl.value.toLowerCase().includes("wmts")) {
    const data = await $fetch<string>(importUrl.value);
    extractWmtsLayers(data);
    currentLayerType.value = "wmts";
  } else if (importUrl.value.toLowerCase().includes("wms")) {
    const data = await $fetch<string>(importUrl.value);
    extractWmsLayers(data);
    currentLayerType.value = "wms";
  }
}

function extractWmtsLayers(capaData: string) {
  const wmtsParser = new WMTSCapabilities();
  const capabilities = wmtsParser.read(capaData);
  const layerList = capabilities.Contents.Layer;

  layers.value = layerList.map(
    (layer: { Identifier: string }) => layer.Identifier,
  );
}

function extractWmsLayers(capaData: string) {
  const wmsParser = new WMSCapabilities();
  const capabilities = wmsParser.read(capaData);
  const layerList = capabilities.Capability.Layer.Layer;

  layers.value = layerList.map((layer: { Name: string }) => layer.Name);
}

/**
 * Build a synthetic OGC `Dataset` for a layer harvested from a raw WMS/WMTS
 * `GetCapabilities` document and push it through the normal layer pipeline.
 *
 * The rest of the app treats every layer as an OGC API record (with `self` and
 * `distributions` links). Externally-imported WMS/WMTS layers have no such
 * record, so we fabricate one whose links point at our own
 * `/api/wpa/v1/layers/external/...` endpoints, which then serve a synthesised
 * Dataset / Distribution collection that mimics the real OGC API shape.
 *
 * This is a deliberate hack: it lets one converter pipeline handle both
 * internal and external layers. See `datamapping/README.md` for context.
 */
function addLayer(layer: string) {
  const capaUrl = new URL(importUrl.value);

  const fakeDataset: Dataset = {
    id: layer,
    links: [
      {
        href: `/api/wpa/v1/layers/external/dataset/${encodedUrl.value}/${layer}`,
        rel: "self",
        title: "This Record",
      },
      {
        href: `/api/wpa/v1/layers/external/${encodedUrl.value}/${layer}`,
        rel: "distributions",
        title: "Distributions",
        type: "application/json",
      },
    ],
    properties: {
      title: `${layer} on ${capaUrl.hostname}`,
      type: "Dataset" as const,
    },
  };

  if (!currentLayerType.value) {
    throw new Error("Layer type must be determined before adding a layer");
  }

  layerStore.addLayer(makeServerLayer(fakeDataset));
}
</script>

<template>
  <div>
    <div class="absolute flex w-full items-center justify-between gap-4 px-2">
      <input
        v-model="importUrl"
        class="w-full border border-gray-200 px-2 py-1"
        placeholder="Capability URL"
        @keydown.enter="loadCapabilities"
      />
      <IconButton @click="loadCapabilities" iconName="Send"></IconButton>
      <IconButton @click="$emit('close')" iconName="X"> </IconButton>
    </div>
    <div class="mt-12 h-[300px] overflow-scroll pb-18">
      <ul>
        <li v-for="layer in layers" :key="layer" class="py-2">
          <button
            class="cursor-pointer hover:bg-cyan-200"
            @click="addLayer(layer)"
          >
            {{ layer }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
