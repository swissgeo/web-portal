import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { FeatureData } from "@/types";

export const useFeaturesStore = defineStore("features", () => {
  const selectedFeaturesByUuid = ref<Record<string, FeatureData[]>>({});

  // extract all geometries from features to give to the viewer for highlighting
  const getSelectedGeometries = computed(() =>
    Object.values(selectedFeaturesByUuid.value).flatMap((features) =>
      features.map((f) => f.geometry),
    ),
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
    getSelectedGeometries,
    getPopupsByUuid,
    getFeaturesIdsByUuid,
    hasSelectedFeatures,
    // ACTIONS
    setSelection,
    $reset,
  };
});
