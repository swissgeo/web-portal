<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import { computedAsync } from "@vueuse/core";

import BackgroundSelectorEntry from "./BackgroundSelectorEntry.vue";
import { AVAILABLE_BACKGROUNDS } from "./constants";

const { locale } = useI18n();
const layerStore = useLayerStore();
const currentBackground = computed(() => layerStore.backgroundLayer);

const catalogItemsUrl = useCatalogItemsUrl();

const backgroundRecords = computed(async () => {
  const promises: Promise<Dataset>[] = [];
  for (const backgroundId of Object.values(AVAILABLE_BACKGROUNDS)) {
    const url = new URL(catalogItemsUrl(backgroundId));

    url.searchParams.set("lang", locale.value);

    promises.push($fetch(url.toString()));
  }

  const values = await Promise.all(promises);
  return values.map((record: Dataset) => {
    return makeServerLayer(record);
  });
});

const sortedBackgroundLayersWithNull = computedAsync<(Layer | null)[]>(
  async () => [...(await backgroundRecords.value), null],
  [null],
);

watch(
  sortedBackgroundLayersWithNull,
  (backgrounds) => {
    // Don't override a background that was already restored (e.g. from sessionStorage)
    if (currentBackground.value !== undefined) {
      return;
    }
    // as soon as the layer data is ready for the backgrounds, select
    // pixelkarte-farbe
    const defaultBackgroundId = AVAILABLE_BACKGROUNDS.colorMap;
    const defaultBackground = backgrounds.find((background) => {
      return (
        background &&
        background.data &&
        typeof background.data === "object" &&
        "id" in background.data &&
        background?.data?.id === defaultBackgroundId
      );
    });

    const fallbackBackground = backgrounds.find(
      (background): background is Layer => {
        return background !== null;
      },
    );
    layerStore.setBackground(defaultBackground ?? fallbackBackground ?? null);
  },
  { once: true },
);

function selectBackground(backgroundLayer: Layer | null) {
  layerStore.setBackground(backgroundLayer);
}
</script>

<template>
  <UCollapsible
    class="flex w-full flex-col-reverse gap-4 rounded-lg bg-elevated p-2"
  >
    <UFormField
      class="group"
      label="Hintergrund"
      :ui="{
        label: 'text-xs',
      }"
    >
      <UButton
        data-testid="background-selector-toggle"
        label="Karte farbig"
        color="neutral"
        variant="subtle"
        trailing-icon="i-lucide-chevron-down"
        :ui="{
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200',
          base: 'bg-accented',
        }"
        block
      />
    </UFormField>
    <template #content>
      <div class="grid h-56 grid-cols-2 gap-2">
        <BackgroundSelectorEntry
          v-for="(backgroundLayer, idx) in sortedBackgroundLayersWithNull"
          :key="idx"
          :backgroundLayer="backgroundLayer"
          :isCurrent="backgroundLayer?.layerUrl === currentBackground?.layerUrl"
          @click="selectBackground(backgroundLayer)"
        />
      </div>
    </template>
  </UCollapsible>
</template>
