import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

import { useMap } from "@swissgeo/map";
import { storeToRefs } from "pinia";
import { computed, readonly, ref, watch } from "vue";

import { useDrawingStore2 } from "../stores/drawing.store";
import { useLayerStore } from "@swissgeo/layers";

/**
 * Type to describe the metrics related to a Point feature
 */
export type PointMetrics = {
  coordinate: [number, number];
};

/**
 * Type to describe the metrics related to a LineString feature
 */
export type LineStringMetrics = {
  lengthMeters: number;
};

/**
 * Type to describe the metrics related to a Polygon feature
 */
export type PolygonMetrics = {
  areaSquareMeters: number;
  perimeterMeters: number;
};

/**
 * Type to describe the metrics related to a Circle feature
 */
export type CircleMetrics = {
  center: [number, number];
  radiusMeters: number;
};

/**
 * Type to describe the metrics related to the currently focused feature, depending on its geometry type. It can be null if no feature is focused.
 */
export type FocusedFeatureMetrics =
  | PointMetrics
  | LineStringMetrics
  | PolygonMetrics
  | CircleMetrics
  | null;

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
  const layerStore = useLayerStore();
  const allDrawInteractions = [
    drawPointInteraction,
    drawLineStringInteraction,
    drawPolygonInteraction,
    drawCircleInteraction,
  ];

  console.log("DEBUG");

  // Adding the drawing layer to the map
  watch(
    isMapLoaded,
    (loaded) => {
      if (!loaded) {
        return;
      }

      if (olMap.value?.getAllLayers().includes(drawingVectorLayer)) {
        return;
      }

      console.log("adding drawing layer...");

      olMap.value?.addLayer(drawingVectorLayer);

      // TODO: check if the "kml" type is appropriate
      layerStore.addLayer({
        uuid: drawingVectorLayer.get("uuid"),
        humanId: drawingVectorLayer.get("humanId"),
        type: "kml",
        isLoading: false,
        info: {
          displayName: "Drawing layer foo bar",
          abstract: "Some drawings",
        },
      });
    },
    { immediate: true },
  );

  /**
   * Get the type of the currently focused feature, if any.
   */
  const focusedFeatureType = computed(() => {
    if (!focusedFeature.value) {
      return null;
    }

    const geometry = focusedFeature.value.getGeometry();
    if (!geometry) {
      return null;
    }

    return geometry.getType();
  });

  const numberOfFeatures = ref(0);

  /**
   * Update the states that exposes the number of features (when added)
   */
  drawingVectorSource.on("addfeature", () => {
    numberOfFeatures.value = drawingVectorSource.getFeatures().length;
  });

  /**
   * Update the states that exposes the number of features (when removed)
   */
  drawingVectorSource.on("removefeature", () => {
    numberOfFeatures.value = drawingVectorSource.getFeatures().length;
  });

  /**
   * As soon as the drawing has started, the feature being created takes the seat as focusedFeature
   * and the focus mode is set to "create".
   */
  drawCircleInteraction.on("drawstart", (event) => {
    focusedFeature.value = event.feature;
    focusMode.value = "create";
  });

  /**
   * When a feature is selected, set it as the focused feature and update the focus mode to "read".
   * When the selection is cleared, reset the focused feature and set the focus mode to "none".
   */
  selectInteractions.on("select", (event) => {
    const selectedFeatures = event.target.getFeatures().getArray();
    if (selectedFeatures.length > 0) {
      focusedFeature.value = selectedFeatures[0];
      focusMode.value = "read";
    } else {
      focusedFeature.value = null;
      focusMode.value = "none";
    }
  });

  // When a feature is finished to be created or modified (tyipically with a double-click),
  // the focus is then switched to "read"
  allDrawInteractions.forEach((interaction) => {
    /**
     * As soon as the drawing has started, the feature being created takes the seat as focusedFeature
     * and the focus mode is set to "create".
     */
    interaction.on("drawstart", (event) => {
      focusedFeature.value = event.feature;
      focusMode.value = "create";
    });

    /**
     * When a drawing ends (in create mode), the interactions are all disabled.
     */
    interaction.on("drawend", () => {
      console.log("EVENT: drawend");
      removeFocus();

      disableAllInteractionWithDelay();
    });

    // interaction.on("modifyend", () => {
    //   console.log("EVENT: modifyend");
    //   focusMode.value = "read";
    // });

    // interaction.on("drawabort", () => {
    //   console.log("EVENT: drawabort");
    //   focusMode.value = "none";
    // });
  });

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

  function disableAllInteractionWithDelay() {
    setTimeout(() => {
      disableAllInteractions();
    }, 50);
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

  /**
   * Enables the draw interaction for the specified geometry type, allowing users to draw new features on the map.
   * It also enables the snap interaction to snap to existing features while drawing.
   */
  function enableDrawInteraction(
    geometryType: "Point" | "LineString" | "Polygon" | "Circle",
  ) {
    if (!olMap.value) {
      return;
    }

    disableAllInteractions();
    removeFocus();
    focusMode.value = "create";

    // Note: the focusedFeature and focus mode will be set in the drawstart event listener of each draw interaction (above)
    switch (geometryType) {
      case "Point":
        olMap.value.addInteraction(drawPointInteraction);
        break;
      case "LineString":
        olMap.value.addInteraction(drawLineStringInteraction);
        break;
      case "Polygon":
        olMap.value.addInteraction(drawPolygonInteraction);
        break;
      case "Circle":
        olMap.value.addInteraction(drawCircleInteraction);
        break;
    }
    olMap.value.addInteraction(snapInteraction);
  }

  /**
   * Removes the currently focused feature from the map. This will also clear the focus and reset the focus mode to "none".
   */
  function removeFocusedFeature() {
    if (!focusedFeature.value || !drawingVectorSource) {
      return;
    }

    drawingVectorSource.removeFeature(
      focusedFeature.value as Feature<Geometry>,
    );
    removeFocus();
  }

  return {
    disableAllInteractions,
    enableSelectInteraction,
    enableModifyInteraction,
    removeFocus,
    enableDrawInteraction,
    removeFocusedFeature,
    focusedFeatureType: readonly(focusedFeatureType),
    numberOfFeatures: readonly(numberOfFeatures),
    focusMode: readonly(focusMode),
    focusedFeature: readonly(focusedFeature),
  };
}
