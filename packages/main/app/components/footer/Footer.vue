<script setup lang="ts">
import type { SingleCoordinate } from "@swissgeo/coordinates";

import log from "@swissgeo/log";
import {
  useMapStore,
  usePositionStore,
  LV95Format,
  LV03Format,
  WGS84Format,
  UTMFormat,
  MGRSFormat,
} from "@swissgeo/map";

import { getHumanReadableCoordinate } from "./mouseTrackerUtils";

const ALL_FORMATS = [
  LV95Format,
  LV03Format,
  WGS84Format,
  UTMFormat,
  MGRSFormat,
];

const { olMap } = storeToRefs(useMapStore());
const { projection } = storeToRefs(usePositionStore());
const runtimeConfig = useRuntimeConfig();

const mousePosition = ref();
const coordinates = ref<SingleCoordinate>([0, 0]);
const displayedFormatId = ref(LV95Format.id);

function setDisplayedFormatWithId(): void {
  const displayedFormat = ALL_FORMATS.find(
    (format) => format.id === displayedFormatId.value,
  );

  if (displayedFormat) {
    mousePosition.value = getHumanReadableCoordinate({
      coordinates: coordinates.value,
      displayedFormat,
      projection: projection.value,
    });
  } else {
    log.error("Unknown coordinates display format", displayedFormatId.value);
  }
}

watch(
  olMap,
  (map, _oldMap, onCleanup) => {
    if (!map) {
      return;
    }
    const handler = (event) => {
      coordinates.value = event.coordinate as SingleCoordinate;
      setDisplayedFormatWithId();
    };
    map.on("pointermove", handler);
    onCleanup(() => map.un("pointermove", handler));
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="text-accent absolute bottom-0 left-0 mb-2.5 flex w-full flex-row items-center justify-between bg-muted p-1 text-xs"
  >
    <div class="flex w-fit flex-row items-center gap-8">
      <div>Scale</div>
      <USelect
        size="xs"
        :ui="{
          content: 'w-full',
          base: 'w-full',
        }"
        :items="
          ALL_FORMATS.map((format) => ({
            label: format.label,
            value: format.id,
          }))
        "
        v-model="displayedFormatId"
        @update:modelValue="setDisplayedFormatWithId"
        class="w-32"
      />
      <div class="font-mono">
        {{ mousePosition }}
      </div>
    </div>
    <div class="flex w-fit flex-row items-center gap-8 pr-3">
      <ULink target="_blank" raw class="flex items-center gap-1"
        >Report issue</ULink
      >
      <ULink
        to="https://github.com/swissgeo/web-portal"
        target="_blank"
        raw
        class="flex items-center gap-1"
      >
        <UIcon name="i-lucide-github" class="size-3 shrink-0" />
        {{ runtimeConfig.public.version }}
      </ULink>
      <ULink
        to="https://geo.admin.ch"
        target="_blank"
        raw
        class="flex items-center gap-1"
        >geo.admin.ch</ULink
      >
      <ULink target="_blank" raw class="flex items-center gap-1"
        >Nutzungsbedingungen</ULink
      >
      <ULink target="_blank" raw class="flex items-center gap-1"
        >Impressum</ULink
      >
    </div>
  </div>
</template>

<style scoped></style>
