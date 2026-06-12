import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * The map View store is used to hold data useful for the map Module to render layers.
 * Sources from @swissgeo/layers will be converted from raw Data to OL-consumable Data.
 */
export const useMapViewStore = defineStore("mapView", () => {
  const isTimeSliderVisible = ref(false);
  const isFullscreenModeActive = ref(false);
  /** Whether the compare slider is currently displayed over the map. */
  const isCompareSliderActive = ref(false);
  /**
   * Horizontal position of the compare slider, expressed as a ratio of the map
   * width (0 = far left, 1 = far right). The topmost visible layer is clipped to
   * the left of this position, revealing the layers underneath on the right.
   */
  const compareRatio = ref(0.5);
  const stateId = ref("");
  const mapLayers: Ref<MapLayer[]> = ref([]);

  const layerStore = useLayerStore();

  /** Visible overlay layers, ordered bottom-to-top (background excluded). */
  const visibleLayers = computed(() =>
    mapLayers.value
      .slice(Number(!!layerStore.backgroundLayer))
      .filter((layer) => layer.isVisible),
  );

  /**
   * Gets either an index or an uuid to identify a layer withing the map Layers,
   * and return the index at which the layer is.
   *
   *
   * @param identifier either the index in the array, or the layer's uuid
   * @returns the index itself, or the index found
   * @throws Error if the uuid is not found within the array
   */
  function _getIndexFromIdentifier(
    identifier: string | number,
  ): number | undefined {
    const index =
      typeof identifier === "number"
        ? identifier
        : mapLayers.value.findIndex((layer) => layer.uuid === identifier);

    if (index < 0 || index >= mapLayers.value.length) {
      log.warn(`Incorrect identifier given : ${identifier}`);
      return;
    }
    return index;
  }

  function getMapLayers(): Ref<MapLayer[]> {
    // returning the Ref so the reactivity is packed within
    return mapLayers;
  }

  function getMapLayerFromUuid(uuid: string): MapLayer | undefined {
    const index = _getIndexFromIdentifier(uuid);

    if (index) {
      return mapLayers.value[index];
    }
    return;
  }

  function addLayerToTop(mapLayer: MapLayer) {
    mapLayers.value.push(mapLayer);
  }

  function addLayerToBottom(mapLayer: MapLayer) {
    mapLayers.value.unshift(mapLayer);
  }

  /**
   * Set a layer to a specific index in the layers array.
   * Handles validation to ensure the target index is within bounds and differs from current position.
   */
  function setLayerIndex(
    identifier: string | number,
    targetIndex: number,
  ): void {
    const currentIndex = _getIndexFromIdentifier(identifier);

    // Validate: current index must be found, target must be in valid range, and must be different
    if (
      currentIndex &&
      currentIndex >= 0 &&
      targetIndex < mapLayers.value.length &&
      targetIndex >= 0 &&
      currentIndex !== targetIndex
    ) {
      const [layer] = mapLayers.value.splice(currentIndex, 1) as [MapLayer];
      mapLayers.value.splice(targetIndex, 0, layer);
    }
  }

  /** Move a layer one step up in the visual stack (toward top, higher index). */
  function moveLayerUp(identifier: string | number): void {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      setLayerIndex(index, index + 1);
    }
  }

  /** Move a layer one step down in the visual stack (toward bottom, lower index). */
  function moveLayerDown(identifier: string | number): void {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      setLayerIndex(index, index - 1);
    }
  }
  function updateLayerOpacity(identifier: string | number, opacity: number) {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      mapLayers.value[index]!.opacity = opacity;
    }
  }

  function removeLayer(identifier: string | number) {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      mapLayers.value.splice(index, 1);
    }
  }

  function updateLayerData(
    identifier: string | number,
    mapLayer: MapLayer,
    canCreateLayer: boolean,
  ) {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      mapLayers.value[index] = mapLayer;
    } else if (canCreateLayer && typeof identifier === "number") {
      mapLayers.value[identifier] = mapLayer;
    }
  }

  function toggleTimeSlider() {
    isTimeSliderVisible.value = !isTimeSliderVisible.value;
  }

  function closeTimeSlider() {
    isTimeSliderVisible.value = false;
  }

  function toggleCompareSlider() {
    isCompareSliderActive.value = !isCompareSliderActive.value;
  }

  function setCompareSliderActive(active: boolean) {
    isCompareSliderActive.value = active;
  }

  /**
   * Update the compare ratio (the slider's horizontal position as a fraction of
   * the map width). Out-of-range input — e.g. a stray value from the URL — is
   * clamped into [0, 1] rather than dropped, so the slider always lands on a
   * usable position. Non-finite input is ignored.
   */
  function setCompareRatio(ratio: number) {
    if (!Number.isFinite(ratio)) {
      return;
    }
    compareRatio.value = Math.min(Math.max(ratio, 0), 1);
  }

  function enterFullscreenMode() {
    isFullscreenModeActive.value = true;
  }

  function exitFullscreenMode() {
    isFullscreenModeActive.value = false;
  }

  function toggleFullscreenMode() {
    isFullscreenModeActive.value = !isFullscreenModeActive.value;
  }

  function setStateId(id: string) {
    stateId.value = id;
  }

  function toggleVisibility(identifier: string | number) {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      mapLayers.value[index]!.isVisible = !mapLayers.value[index]!.isVisible;
    }
  }

  function setVisibility(identifier: string | number, visibility: boolean) {
    const index = _getIndexFromIdentifier(identifier);
    if (index || index === 0) {
      mapLayers.value[index]!.isVisible = visibility;
    }
  }

  return {
    // values
    isTimeSliderVisible,
    isFullscreenModeActive,
    isCompareSliderActive,
    compareRatio,
    mapLayers,
    // getters
    visibleLayers,
    getMapLayers,
    getMapLayerFromUuid,
    // actions
    toggleTimeSlider,
    closeTimeSlider,
    toggleCompareSlider,
    setCompareSliderActive,
    setCompareRatio,
    enterFullscreenMode,
    exitFullscreenMode,
    toggleFullscreenMode,
    stateId,
    setStateId,
    updateLayerData,
    updateLayerOpacity,
    removeLayer,
    addLayerToBottom,
    addLayerToTop,
    setVisibility,
    toggleVisibility,
    moveLayerUp,
    moveLayerDown,
  };
});
