import type { ComputedRef } from "vue";

import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { FeatureData, WmsFeatureInfoCapability } from "@/types";

export const useFeaturesStore = defineStore("features", () => {
  const selectedFeaturesByUuid = ref<Record<string, FeatureData[]>>({});

  /**
   * For each layer, its feature info capabilities. Only populated by queryable
   * WMS layers.
   */
  const wmsCapabilitiesByUuid = ref<Record<string, WmsFeatureInfoCapability>>(
    {},
  );

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

  function getWmsCapability(
    uuid: string,
  ): WmsFeatureInfoCapability | undefined {
    return wmsCapabilitiesByUuid.value[uuid];
  }

  function setWmsCapability(
    uuid: string,
    capability: WmsFeatureInfoCapability,
  ): void {
    wmsCapabilitiesByUuid.value[uuid] = capability;
  }

  function clearWmsCapability(uuid: string): void {
    delete wmsCapabilitiesByUuid.value[uuid];
  }

  return {
    selectedFeaturesByUuid,
    wmsCapabilitiesByUuid,
    // GETTERS
    getFeaturesGeoJSON,
    getPopupsByUuid,
    getFeaturesIdsByUuid,
    hasSelectedFeatures,
    // ACTIONS
    setSelection,
    $reset,
    getWmsCapability,
    setWmsCapability,
    clearWmsCapability,
  };
});
