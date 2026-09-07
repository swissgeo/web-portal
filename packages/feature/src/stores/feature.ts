import { defineStore } from "pinia";
import { computed, ref, type ComputedRef } from "vue";

import type { FeatureData } from "@/types";
import { HIGHLIGHT_LAYER_ID } from "@swissgeo/shared";

export const useFeaturesStore = defineStore("features", () => {
  const selectedFeaturesByUuid = ref<Record<string, FeatureData[]>>({});

  // wrap geometries in a geoJSON for the viewer to render as a geoJSON
  const getFeaturesGeoJSON: ComputedRef<GeoJSON.FeatureCollection> = computed(
    () => {
      return {
        type: "FeatureCollection",
        features: Object.entries(selectedFeaturesByUuid.value).flatMap(
          ([layerUuid, features]) =>
            features.map((feature) => {
              return {
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                  layerUuid,
                  featureId: feature.featureId,
                },
              };
            }),
        ),
      };
    },
  );

  const getPopupsByUuid = computed(() =>
    Object.fromEntries(
      Object.entries(selectedFeaturesByUuid.value).map(([uuid, features]) => [
        uuid,
        features.map((feature) => feature.content),
      ]),
    ),
  );

  const getFeaturesIdsByUuid = computed(() =>
    Object.fromEntries(
      Object.entries(selectedFeaturesByUuid.value).map(([uuid, features]) => [
        uuid,
        features.map((feature) => feature.featureId),
      ]),
    ),
  );

  const hasSelectedFeatures = computed(
    () => Object.keys(selectedFeaturesByUuid.value).length > 0,
  );

  function setSelection(featuresPerLayer: Record<string, FeatureData[]>): void {
    selectedFeaturesByUuid.value = Object.fromEntries(
      Object.entries(featuresPerLayer).filter(
        ([, features]) => features.length > 0,
      ),
    );
  }

  function $reset(): void {
    selectedFeaturesByUuid.value = {};
  }

  return {
    selectedFeaturesByUuid,
    // GETTERS
    getFeaturesGeoJSON,
    getPopupsByUuid,
    getFeaturesIdsByUuid,
    hasSelectedFeatures,
    // ACTIONS
    setSelection,
    $reset,
  };
});
