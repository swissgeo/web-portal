<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { makeServerLayer } from "@swissgeo/layers";
import { computedAsync } from "@vueuse/core";
import { joinURL } from "ufo";

import { AVAILABLE_BACKGROUNDS } from "./constants";

const displayMode = inject<"web" | "print" | "embed">("displayMode");

const emit = defineEmits<{
  setBackground: [backgroundLayer: Layer | null];
}>();

const { currentBackground } = defineProps<{
  currentBackground: Layer | null;
}>();

const runtimeConfig = useRuntimeConfig();

const backgroundRecords = computed(async () => {
  const promises: Promise<Dataset>[] = [];
  for (const backgroundId of AVAILABLE_BACKGROUNDS) {
    promises.push(
      $fetch(
        joinURL(
          runtimeConfig.public.ogcApiEndpoint,
          "/collections/",
          runtimeConfig.public.ogcCatalogCollection,
          "/items/",
          backgroundId,
        ),
      ),
    );
  }

  const values = await Promise.all(promises);
  return values.map((record: Dataset) => {
    return makeServerLayer(record);
  });
});

const sortedBackgroundLayersWithNull = computedAsync<(Layer | null)[]>(
  async () => [null, ...(await backgroundRecords.value)],
  [null],
);

onMounted(() => {
  // Don't reset if a background was already restored (e.g. from sessionStorage)
  if (!currentBackground) {
    emit("setBackground", null);
  }
});

watch(
  sortedBackgroundLayersWithNull,
  (backgrounds) => {
    // Don't override a background that was already restored (e.g. from sessionStorage)
    if (currentBackground) {
      return;
    }
    // as soon as the layer data is ready for the backgrounds, select
    // pixelkarte-farbe
    const defaultBackgroundId = AVAILABLE_BACKGROUNDS[1];
    const defaultBackground = backgrounds.find((background) => {
      return (
        background &&
        background.data &&
        typeof background.data === "object" &&
        background?.data?.id === defaultBackgroundId
      );
    });

    const fallbackBackground = backgrounds.find(
      (background): background is Layer => {
        return background !== null;
      },
    );
    emit("setBackground", defaultBackground ?? fallbackBackground ?? null);
  },
  { once: true },
);

function selectBackground(backgroundLayer: Layer | null) {
  emit("setBackground", backgroundLayer);
}
</script>

<template>
  <!-- Desktop (sm+): rectangular buttons spread to the left, fixed bottom-right -->
  <MapBackgroundSelectorSquared
    v-if="displayMode === 'web'"
    :background-layers="sortedBackgroundLayersWithNull"
    :current-background-layer="currentBackground"
    @select-background="selectBackground"
  />
  <!-- Mobile (below sm): circular buttons spread upward, fixed bottom-left -->
  <MapBackgroundSelectorRounded
    v-if="displayMode === 'web'"
    :background-layers="sortedBackgroundLayersWithNull"
    :current-background-layer="currentBackground"
    @select-background="selectBackground"
  />
</template>
