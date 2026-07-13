import log, { LogPreDefinedColor } from "@swissgeo/log";
import { defineStore } from "pinia";
import { ref } from "vue";

import type { Dimension, DimensionId, DimensionRecord } from "@/index";

export const useDimensionsStore = defineStore("dimensions", () => {
  /** Keyed by layer uuid. Absent key = layer has no dimension set. */
  const dimensionsByLayer = ref<Record<string, DimensionRecord>>({});

  function getDimensions(uuid: string): DimensionRecord | undefined {
    return dimensionsByLayer.value[uuid];
  }

  function layersWithDimension(id: DimensionId): string[] {
    return Object.entries(dimensionsByLayer.value)
      .filter(([, record]) => record[id] !== undefined)
      .map(([uuid]) => uuid);
  }

  function setDimension(
    uuid: string,
    id: DimensionId,
    dimension: Partial<Dimension>,
  ): void {
    if (!dimensionsByLayer.value[uuid]) {
      dimensionsByLayer.value[uuid] = {};
    }

    log.debug({
      title: "dimensions store",
      titleColor: LogPreDefinedColor.Cyan,
      messages: [
        `Updating layer ${uuid} with dimension ${JSON.stringify(dimension)}`,
      ],
    });

    const existing = dimensionsByLayer.value[uuid]?.[id];

    dimensionsByLayer.value[uuid][id] = {
      availableValues: existing?.availableValues ?? [],
      currentValue: existing?.currentValue ?? null,
      ...dimension,
    };
  }

  function setLayerDimensions(uuid: string, record: DimensionRecord): void {
    dimensionsByLayer.value[uuid] = record;
  }

  function clearLayerDimensions(uuid: string): void {
    delete dimensionsByLayer.value[uuid];
  }

  function $reset(): void {
    dimensionsByLayer.value = {};
  }

  return {
    dimensionsByLayer,
    // getters
    getDimensions,
    layersWithDimension,
    // actions
    setDimension,
    setLayerDimensions,
    clearLayerDimensions,
    $reset,
  };
});
