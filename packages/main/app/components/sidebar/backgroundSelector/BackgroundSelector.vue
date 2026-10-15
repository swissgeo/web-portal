<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import { computedAsync } from "@vueuse/core";

import BackgroundSelectorEntry from "./BackgroundSelectorEntry.vue";
import {
  AVAILABLE_BACKGROUNDS,
  getBackgroundTranslationKey,
} from "./constants";

const { locale, t } = useI18n();
const layerStore = useLayerStore();
const currentBackground = computed(() => layerStore.backgroundLayer);
// The tile list is as wide as the whole gray box, not only the button
const selectorBox = useTemplateRef<HTMLElement>("selectorBox");

const currentBackgroundLabel = computed(() =>
  t(getBackgroundTranslationKey(currentBackground.value)),
);

const catalogItemsUrl = useCatalogItemsUrl();

const backgroundRecords = computed(async () => {
  const promises: Promise<Dataset>[] = [];
  for (const backgroundId of Object.values(AVAILABLE_BACKGROUNDS)) {
    const url = new URL(catalogItemsUrl(backgroundId));

    url.searchParams.set("lang", locale.value);

    promises.push($fetch(url.toString()));
  }

  const values = await Promise.all(promises);
  return Promise.all(values.map((record: Dataset) => makeServerLayer(record)));
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
  <div ref="selectorBox" class="w-full rounded-lg bg-elevated p-2">
    <UFormField
      :label="t('backgroundLayers.label')"
      :ui="{
        label: 'text-xs',
      }"
    >
      <!-- The tile list opens over the drawer content, so every background stays reachable -->
      <UPopover
        :reference="selectorBox ?? undefined"
        :content="{ side: 'top' }"
        :ui="{
          content:
            'max-h-(--reka-popover-content-available-height) w-(--reka-popper-anchor-width) overflow-y-auto bg-elevated p-2',
        }"
      >
        <template #default="{ open }">
          <UButton
            data-testid="background-selector-toggle"
            :label="currentBackgroundLabel"
            color="neutral"
            variant="subtle"
            :trailing-icon="
              open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
            "
            :ui="{
              base: 'bg-accented',
            }"
            block
          />
        </template>
        <template #content>
          <div class="grid h-56 grid-cols-2 gap-2">
            <BackgroundSelectorEntry
              v-for="(backgroundLayer, idx) in sortedBackgroundLayersWithNull"
              :key="idx"
              :backgroundLayer="backgroundLayer"
              :isCurrent="
                backgroundLayer?.layerUrl === currentBackground?.layerUrl
              "
              @click="selectBackground(backgroundLayer)"
            />
          </div>
        </template>
      </UPopover>
    </UFormField>
  </div>
</template>
