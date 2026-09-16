<script setup lang="ts">
import type { SingleCoordinate } from "@swissgeo/coordinates";
import type MapBrowserEvent from "ol/MapBrowserEvent";

import log from "@swissgeo/log";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";

import { useMapStore } from "@/stores/map";
import usePositionStore from "@/stores/position";
import { LV95Format, allFormats } from "@/utils/coordinates/coordinateFormat";
import getHumanReadableCoordinate from "@/utils/mouseTrackerUtils";

const { olMap } = storeToRefs(useMapStore());
const { projection } = storeToRefs(usePositionStore());

const mousePosition = ref();
const coordinates = ref<SingleCoordinate>([0, 0]);
const displayedFormatId = ref(LV95Format.id);

function setDisplayedFormatWithId(): void {
  const displayedFormat = allFormats.find(
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
    const handler = (event: MapBrowserEvent) => {
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
  <div class="flex flex-row items-center gap-2">
    <USelect
      size="xs"
      variant="ghost"
      :ui="{
        content: 'min-w-fit',
        base: 'min-w-fit',
      }"
      :items="
        allFormats.map((format) => ({
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
</template>

<style scoped></style>
