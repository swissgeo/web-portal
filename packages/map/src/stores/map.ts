import type { Map as OlMapType } from "ol";

import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export const useMapStore = defineStore("map", () => {
  const olMap = shallowRef<OlMapType | null>(null);
  const isMapLoaded = ref(false);
  /**
   * Resolution (m/px) of the tile level that tiled layers request, when their grid has it, instead
   * of the level closest to the view resolution. Set when printing. Set it before the layers exist.
   */
  const pinnedTileResolution = ref<number | null>(null);

  function setOlMap(map: OlMapType) {
    olMap.value = map;
  }

  function setIsMapLoaded() {
    isMapLoaded.value = true;
  }

  /** Sets the tile resolution to pin, or null to stop pinning */
  function setPinnedTileResolution(resolution: number | null) {
    pinnedTileResolution.value = resolution;
  }

  return {
    olMap,
    setOlMap,
    setIsMapLoaded,
    isMapLoaded,
    pinnedTileResolution,
    setPinnedTileResolution,
  };
});
