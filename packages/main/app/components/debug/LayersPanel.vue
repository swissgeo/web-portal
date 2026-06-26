<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { IconButton } from "@swissgeo/skeleton";

const { locale } = useI18n();

const filterTerm = ref<string>("");
// the composable will update the data if the locale changes
const { data: recordLayers } = useOgcCatalog(locale);

const availableLayers = computed(() => {
  return recordLayers.value;
});

const filteredAvailableLayers = computed((): Dataset[] => {
  if (!availableLayers.value) {
    return [];
  }

  if (filterTerm.value === "") {
    return availableLayers.value.features;
  }
  return availableLayers.value.features.filter((layer: Dataset) =>
    layer.id.includes(filterTerm.value),
  );
});

const faultyLayer = {
  id: "ch.faulty",
  links: [
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/swissgeo.catalog/items/ch.bafu.schutzgebiete-luftfahrt?language=en",
      rel: "self",
      title: "This Record",
      type: "application/json",
      hreflang: "en",
    },
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/swissgeo.catalog?language=en",
      rel: "collection",
      title: "Link to the collection this item belongs to",
      type: "application/json",
      hreflang: "en",
    },
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/ch.bafu.schutzgebiete-luftfahrt.distributions/itms",
      rel: "distributions",
      title: "Distributions",
      type: "application/json",
    },
    {
      href: "https://www.geocat.ch/geonetwork/srv/eng/catalog.search#/metadata/c3f513a7-f860-4894-a139-6218a9697519",
      rel: "alternate",
      title: "GeoCat Metadata",
      type: "application/json",
    },
  ],
  linkTemplates: [],
  type: "Feature" as const,
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [5.96, 45.82],
        [5.96, 47.81],
        [10.49, 47.81],
        [10.49, 45.82],
        [5.96, 45.82],
      ],
    ],
  },
  properties: {
    title: "Faulty Layer",
    contacts: [
      {
        organization:
          "Federal Office for the Environment / Biodiversity and Landscape Division",
        country: "CH",
        role: "pointOfContact",
      },
    ],
    description:
      "The layer protected areas in the military air navigation obstacles publication1:100'000 contains the Swiss National Park, raised bogs, selected floodplains and fens, water and migrant bird reserves and Swiss game reserves.",
    language: {
      code: "en",
      name: "English",
      dir: "ltr",
    },
    languages: [
      {
        code: "de",
        name: "Deutsch",
        dir: "ltr",
        alternate: "German",
      },
      {
        code: "fr",
        name: "Français",
        dir: "ltr",
        alternate: "French",
      },
      {
        code: "it",
        name: "Italiano",
        dir: "ltr",
        alternate: "Italian",
      },
      {
        code: "en",
        name: "English",
        dir: "ltr",
      },
    ],
    preferredDistributionId: "ch.bafu.schutzgebiete-luftfahrt:wmts",
    type: "Dataset" as const,
  },
};
</script>

<template>
  <div>
    <div class="absolute flex w-full items-center justify-between gap-4 px-2">
      <input
        v-model="filterTerm"
        class="w-full border border-gray-200 px-2 py-1"
        placeholder="Filter"
        autofocus
      />
      <IconButton @click="$emit('close')" iconName="X"> </IconButton>
    </div>
    <div class="mt-12 h-75 overflow-scroll pb-18">
      <table class="">
        <DebugLayersPanelEntry :dataset="faultyLayer"> ></DebugLayersPanelEntry>
        <DebugLayersPanelEntry
          :dataset="layer"
          v-for="layer in filteredAvailableLayers"
          :key="layer.id"
        />
      </table>
    </div>
  </div>
</template>
