<script setup lang="ts">
import type { SingleCoordinate } from "@swissgeo/coordinates";
import type MapBrowserEvent from "ol/MapBrowserEvent";

import log from "@swissgeo/log";
import { watchDebounced } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { ref } from "vue";

import { useMapStore } from "@/stores/map";
import usePositionStore from "@/stores/position";
import { LV95Format, allFormats } from "@/utils/coordinates/coordinateFormat";
import getHumanReadableCoordinate from "@/utils/mouseTrackerUtils";

const { olMap } = storeToRefs(useMapStore());
const { projection } = storeToRefs(usePositionStore());

const mousePosition = ref<string>();
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

watchDebounced(
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
  { immediate: true, debounce: 250 },
);
</script>

<template>
  <div class="flex flex-row items-center gap-2">
    <USelect
      size="xs"
      variant="none"
      :ui="{
        content: 'min-w-fit',
        base: 'min-w-fit py-space-2xs ps-0 pe-[calc(13px+0.375rem)] text-tiny font-medium text-accent',
        trailing: 'pe-0',
        trailingIcon: 'size-[13px] text-accent',
      }"
      :items="
        allFormats.map((format) => ({
          label: format.label,
          value: format.id,
        }))
      "
      v-model="displayedFormatId"
      @update:modelValue="setDisplayedFormatWithId"
    />
    <div class="font-mono">
      {{ mousePosition }}
    </div>
  </div>
</template>
