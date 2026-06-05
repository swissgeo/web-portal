import { useMap } from "@swissgeo/map";
import { storeToRefs } from "pinia";

import { useDrawingStore2 } from "../stores/drawing.store";

export function useDrawing() {
  const drawingStore = useDrawingStore2();
  const { focusedFeature, focusMode } = storeToRefs(drawingStore);
  const {
    drawingVectorSource,
    drawingVectorLayer,
    modifyInteraction,
    drawPointInteraction,
    drawLineStringInteraction,
    drawPolygonInteraction,
    drawCircleInteraction,
    snapInteraction,
    selectInteractions,
  } = drawingStore;
  const { olMap, isMapLoaded } = useMap();

  /**
   * Disables all editing and select interactions on the map
   */
  function disableAllInteractions() {
    if (!olMap.value) {
      return;
    }

    olMap.value.removeInteraction(modifyInteraction);
    olMap.value.removeInteraction(drawPointInteraction);
    olMap.value.removeInteraction(drawLineStringInteraction);
    olMap.value.removeInteraction(drawPolygonInteraction);
    olMap.value.removeInteraction(drawCircleInteraction);
    olMap.value.removeInteraction(snapInteraction);
    olMap.value.removeInteraction(selectInteractions);
  }

  /**
   * Enables the select interaction, allowing users to select features on the map.
   * This will also clear any existing selection and focused feature, as the select interaction starts fresh when enabled.
   */
  function enableSelectInteraction() {
    if (!olMap.value) {
      return;
    }

    disableAllInteractions();
    olMap.value.addInteraction(selectInteractions);

    // When the selection interaction is enabled, it is automatically restarting
    // from a blank slate, so we can clear the current selection and focused feature.
    removeFocus();
  }

  /**
   * Enables the modify interaction, allowing users to edit the geometry of the currently selected feature.
   * If no feature is selected, it will not enable the interaction, as there would be nothing to modify.
   */
  function enableModifyInteraction() {
    if (!olMap.value) {
      return;
    }

    if (!focusedFeature.value) {
      console.log("A feature must first be selected");
      return;
    }

    disableAllInteractions();
    olMap.value.addInteraction(modifyInteraction);
    olMap.value.addInteraction(snapInteraction);
    focusMode.value = "edit";
  }

  /**
   * Clears the current feature selection and resets the focus mode to "none"
   */
  function removeFocus() {
    selectInteractions.clearSelection();
    focusedFeature.value = null;
    focusMode.value = "none";
  }

  return {
    drawingStore,
    olMap,
    isMapLoaded,
    disableAllInteractions,
    enableSelectInteraction,
    enableModifyInteraction,
    removeFocus,
  };
}
