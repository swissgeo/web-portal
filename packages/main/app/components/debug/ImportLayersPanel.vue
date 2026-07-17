<script setup lang="ts">
import type { Dataset } from "@swissgeo/ogc";

import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import { IconButton } from "@swissgeo/skeleton";
import WMSCapabilities from "ol/format/WMSCapabilities";
import WMTSCapabilities from "ol/format/WMTSCapabilities";

const layerStore = useLayerStore();

const importUrl = ref("https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml");

// Common capability URLs, so they don't have to be typed every time.
const presetUrls = [
  {
    label: "geo.admin — WMTS (EPSG:2056)",
    url: "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
  },
  {
    label: "geo.admin — WMTS (EPSG:3857)",
    url: "https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml",
  },
  {
    label: "geo.admin — WMS",
    url: "https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
  },
  {
    label: "geo.bs.ch — WMTS",
    url: "https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml",
  },
];

const showPresets = ref(false);

function applyPreset(url: string) {
  importUrl.value = url;
  showPresets.value = false;
  void loadCapabilities();
}
const layers: Ref<string[]> = ref([]);
const currentLayerType: Ref<string | null> = ref(null);

const layerFilter = ref("");
const filteredLayers = computed(() => {
  const query = layerFilter.value.trim().toLowerCase();
  if (!query) {
    return layers.value;
  }
  return layers.value.filter((layer) => layer.toLowerCase().includes(query));
});

const encodedUrl = computed(() => encodeCapabilityUrl(importUrl.value));

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
    <div
      class="absolute z-10 flex w-full items-center justify-between gap-2 px-2"
    >
      <div class="relative w-full">
        <input
          v-model="importUrl"
          data-testid="import-capability-url"
          class="w-full border border-gray-200 py-1 pr-7 pl-2"
          placeholder="Capability URL (type or pick a preset)"
          @keydown.enter="loadCapabilities"
        />
        <button
          type="button"
          class="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer px-1 text-gray-500"
          title="Preset capability URLs"
          @click="showPresets = !showPresets"
        >
          ▾
        </button>
        <ul
          v-if="showPresets"
          class="absolute top-full right-0 left-0 z-20 max-h-60 overflow-auto border border-gray-200 bg-white shadow"
        >
          <li v-for="preset in presetUrls" :key="preset.url">
            <button
              type="button"
              class="block w-full cursor-pointer px-2 py-1 text-left hover:bg-cyan-200"
              @click="applyPreset(preset.url)"
            >
              {{ preset.label }}
            </button>
          </li>
        </ul>
      </div>
      <IconButton
        data-testid="import-load-capabilities"
        @click="loadCapabilities"
        iconName="Send"
      ></IconButton>
      <IconButton
        data-testid="import-close"
        @click="$emit('close')"
        iconName="X"
      >
      </IconButton>
    </div>
    <div class="mt-12 h-[300px] overflow-scroll pb-18">
      <input
        v-if="layers.length"
        v-model="layerFilter"
        class="mb-2 w-full border border-gray-200 px-2 py-1"
        :placeholder="`Filter ${layers.length} layers…`"
      />
      <ul data-testid="import-layer-list">
        <li v-for="layer in filteredLayers" :key="layer" class="py-2">
          <button
            :data-testid="`import-layer-${layer}`"
            class="cursor-pointer hover:bg-cyan-200"
            @click="addLayer(layer)"
          >
            {{ layer }}
          </button>
        </li>
        <li
          v-if="layers.length && !filteredLayers.length"
          class="py-2 text-gray-400"
        >
          No layers match “{{ layerFilter }}”
        </li>
      </ul>
    </div>
  </div>
</template>
