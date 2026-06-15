import type { Map as OlMap } from "ol";
import type { Coordinate } from "ol/coordinate";
import type Feature from "ol/Feature";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";
import type VectorLayer from "ol/layer/Vector";
import type { Ref } from "vue";

import { registerProj4, WGS84 } from "@swissgeo/coordinates";
import { useLayerStore } from "@swissgeo/layers";
import { storeToRefs } from "pinia";
import proj4 from "proj4";
import { computed, nextTick, onMounted, readonly, ref, watch } from "vue";

import type { FocusMode } from "../stores/drawing.store";

import { useDrawingStore2 } from "../stores/drawing.store";
import { getLinearRingLength } from "../utils/drawingUtils";
import {
  applyIdleStyle,
  applyEditingStyle,
  applySelectedStyle,
  initializeStyleProperties,
  getStylePropertiesAsObject,
  type FeatureStyle,
  setStylePropertiesFromObject,
  FILL_COLOR_KEY,
  STROKE_COLOR_KEY,
  STROKE_WIDTH_KEY,
  POINT_RADIUS_KEY,
  POINT_COLOR_KEY,
} from "../utils/drawingStyle";

registerProj4(proj4);

/**
 * Type to describe the metrics related to a Point feature
 */
export type PointMetrics = {
  coordinate: Coordinate;
  coordinatesWgs84: Coordinate;
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
  center: Coordinate;
  centerWgs84: Coordinate;
  radiusMeters: number;
  areaSquareMeters: number;
  perimeterMeters: number;
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

export function useDrawing(olMap: OlMap) {
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
  const layerStore = useLayerStore();
  const allDrawInteractions = [
    drawPointInteraction,
    drawLineStringInteraction,
    drawPolygonInteraction,
    drawCircleInteraction,
  ];

  /**
   * This is an incremental counter that updates when the feature in focus is being created or edited.
   * This if only for internal use to trigger the update of the computed property focusedFeatureMetrics.
   */
  const creatingOrEditingIterations = ref(0);

  /**
   * This is the metrics specific to the feature in focus.
   * They are update as the user draws of edits.
   */
  const focusedFeatureMetrics = ref<FocusedFeatureMetrics>(null);

  const fillColor = ref<string | null>("#ff00ff");
  const strokeColor = ref<string | null>(null);
  const strokeWidth = ref<number | null>(null);
  const pointRadius = ref<number | null>(null);
  const pointColor = ref<string | null>(null);

  watch(
    creatingOrEditingIterations,
    () => {
      focusedFeatureMetrics.value = computeFocusedFeatureMetrics();

      console.log("change");

      // Refresh some styling properties that are exposed as
      fillColor.value = focusedFeature.value?.get(FILL_COLOR_KEY) ?? null;
      strokeColor.value = focusedFeature.value?.get(STROKE_COLOR_KEY) ?? null;
      strokeWidth.value = focusedFeature.value?.get(STROKE_WIDTH_KEY) ?? null;
      pointRadius.value = focusedFeature.value?.get(POINT_RADIUS_KEY) ?? null;
      pointColor.value = focusedFeature.value?.get(POINT_COLOR_KEY) ?? null;
    },
    { immediate: true },
  );

  /**
   * Compute the metrics related to the focused feature, depending on its geometry type.
   */
  function computeFocusedFeatureMetrics(): FocusedFeatureMetrics {
    if (!focusedFeature.value) {
      return null;
    }

    const geometry = focusedFeature.value.getGeometry();

    if (!geometry) {
      return null;
    }

    switch (geometry.getType()) {
      case "Point": {
        const coordinates = (geometry as Point).getCoordinates();
        const coordinatesWgs84 = proj4(
          olMap.getView().getProjection().getCode(),
          WGS84.epsg,
          coordinates,
        );
        return { coordinate: coordinates, coordinatesWgs84 };
      }

      case "LineString": {
        const lengthMeters = (geometry as LineString).getLength();
        return { lengthMeters };
      }

      case "Polygon": {
        const areaSquareMeters = (geometry as Polygon).getArea();
        const perimeterMeters = getLinearRingLength(
          (geometry as Polygon).getLinearRing(0),
        );

        return { areaSquareMeters, perimeterMeters };
      }
      case "Circle": {
        const center = (geometry as Circle).getCenter();
        const centerWgs84 = proj4(
          olMap.getView().getProjection().getCode(),
          WGS84.epsg,
          center,
        );
        const radiusMeters = (geometry as Circle).getRadius();

        const areaSquareMeters = Math.PI * radiusMeters * radiusMeters;
        const perimeterMeters = 2 * Math.PI * radiusMeters;
        return {
          center,
          centerWgs84,
          radiusMeters,
          areaSquareMeters,
          perimeterMeters,
        };
      }
      default:
        return null;
    }
  }

  // watchEffect(() => {
  //   drawingVectorLayer.setVisible(layer.value.isVisible);
  // });

  // watchEffect(() => {
  //   drawingVectorLayer.setOpacity(layer.value.opacity);
  // });

  // Adding the drawing layer to the map
  // watch(
  //   isMapLoaded,
  //   (loaded) => {
  //     if (!loaded) {
  //       return;
  //     }

  //     // As the map is available, all the interactions necessary to the drawing feature
  //     // are add, but all are disabled by default.
  //     olMap.value.addInteraction(modifyInteraction);
  //     olMap.value.addInteraction(drawPointInteraction);
  //     olMap.value.addInteraction(drawLineStringInteraction);
  //     olMap.value.addInteraction(drawPolygonInteraction);
  //     olMap.value.addInteraction(drawCircleInteraction);
  //     olMap.value.addInteraction(snapInteraction);
  //     olMap.value.addInteraction(selectInteractions);

  //     if (olMap.value?.getAllLayers().includes(drawingVectorLayer)) {
  //       return;
  //     }

  //     console.log("adding drawing layer...");

  //     olMap.value?.addLayer(drawingVectorLayer);

  //     // TODO: check if the "kml" type is appropriate
  //     layerStore.addLayer({
  //       uuid: drawingVectorLayer.get("uuid"),
  //       humanId: drawingVectorLayer.get("humanId"),
  //       type: "kml",
  //       isLoading: false,
  //       info: {
  //         displayName: "Drawing layer foo bar",
  //         abstract: "Some drawings",
  //       },
  //     });
  //   },
  //   { immediate: true },
  // );

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

  onMounted(() => {
    console.log(">>>>>>>>> >>> drawingVectorLayer", drawingVectorLayer);
    numberOfFeatures.value = drawingVectorSource.getFeatures().length;

    // As the map is available, all the interactions necessary to the drawing feature
    // are add, but all are disabled by default.
    olMap.addInteraction(modifyInteraction);
    olMap.addInteraction(drawPointInteraction);
    olMap.addInteraction(drawLineStringInteraction);
    olMap.addInteraction(drawPolygonInteraction);
    olMap.addInteraction(drawCircleInteraction);
    olMap.addInteraction(snapInteraction);
    olMap.addInteraction(selectInteractions);

    if (olMap.getAllLayers().includes(drawingVectorLayer)) {
      return;
    }

    console.log("adding drawing layer...");

    olMap.addLayer(drawingVectorLayer);

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
  });

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
   * When a feature is selected, set it as the focused feature and update the focus mode to "read".
   * When the selection is cleared, reset the focused feature and set the focus mode to "none".
   */
  selectInteractions.on("select", (event) => {
    const selectedFeatures = event.target.getFeatures().getArray();
    if (selectedFeatures.length > 0) {
      focusedFeature.value = selectedFeatures[0];
      focusMode.value = "select";
    } else {
      focusedFeature.value = null;
      focusMode.value = "none";
    }
  });

  /**
   * A feature was focused and is no longer focused, whether another one is focused or none,
   * The style is reset to the basic style (in case it was in edit or create mode before)
   */
  watch(focusedFeature, (newFocusedFeature, oldFocusedFeature) => {
    console.log("FOCUSED ON", focusedFeature);

    if (oldFocusedFeature && oldFocusedFeature !== newFocusedFeature) {
      applyIdleStyle(oldFocusedFeature);
      return;
    }
  });

  /**
   * Update the style of the feature
   */
  watch([focusedFeature, focusMode], ([newFocusedFeature, newFocusMode]) => {
    if (!newFocusedFeature) {
      return;
    }

    switch (newFocusMode) {
      case "none":
        applyIdleStyle(focusedFeature.value);
        break;
      case "select":
        applySelectedStyle(focusedFeature.value);
        break;

      case "create":
        // Add the default styling properties
        // (not the creating/editing style, but the style that can later be modified and persited)
        initializeStyleProperties(focusedFeature.value);

        // Add an empty description to the new polygon
        focusedFeature.value.set("description", "");

      // Note: no break here, as the creating style is the same as the editing style for now
      // eslint-disable-next-line no-fallthrough
      case "edit":
        // Apply the style for creating/editing to the feature,
        // so that it is visually different while being created/edited.
        applyEditingStyle(focusedFeature.value);
        break;
    }
  });

  function setFillColor(color: string) {
    if (!focusedFeature.value) {
      return;
    }
    focusedFeature.value.set(FILL_COLOR_KEY, color);
  }

  function setStrokeColor(color: string) {
    if (!focusedFeature.value) {
      return;
    }
    focusedFeature.value.set(STROKE_COLOR_KEY, color);
  }

  // When a feature is finished to be created or modified (tyipically with a double-click),
  // the focus is then switched to "none"
  allDrawInteractions.forEach((interaction) => {
    /**
     * As soon as the drawing has started, the feature being created takes the seat as focusedFeature
     * and the focus mode is set to "create".
     */
    interaction.on("drawstart", (event) => {
      focusedFeature.value = event.feature;

      focusedFeature.value.on("change", () => {
        creatingOrEditingIterations.value++;
      });
    });

    /**
     * When a drawing ends (in create mode), the interactions are all disabled.
     */
    interaction.on("drawend", async () => {
      console.log("EVENT: drawend.");

      // the disabling of all interactions is delayed to avoid conflicts with the internal logic of OL,
      // because is disabled immediately at "drawend", the DoubleClick event would trigger as part of validating a drawing.
      await nextTick(() => {
        removeFocus();
        disableAllInteractions();
      });
    });

    // interaction.on("modifyend", () => {
    //   console.log("EVENT: modifyend");
    // });

    // interaction.on("drawabort", () => {
    //   console.log("EVENT: drawabort");
    // });
  });

  /**
   * Disables all editing and select interactions on the map
   */
  function disableAllInteractions() {
    if (!olMap) {
      return;
    }

    modifyInteraction.setActive(false);
    drawPointInteraction.setActive(false);
    drawLineStringInteraction.setActive(false);
    drawPolygonInteraction.setActive(false);
    drawCircleInteraction.setActive(false);
    snapInteraction.setActive(false);
    selectInteractions.setActive(false);
    creatingOrEditingIterations.value = 0;
  }

  /**
   * Enables the select interaction, allowing users to select features on the map.
   * This will also clear any existing selection and focused feature, as the select interaction starts fresh when enabled.
   */
  function enableSelectInteraction() {
    if (!olMap) {
      return;
    }

    disableAllInteractions();
    selectInteractions.setActive(true);

    // When the selection interaction is enabled, it is automatically restarting
    // from a blank slate, so we can clear the current selection and focused feature.
    removeFocus();
  }

  /**
   * Enables the modify interaction, allowing users to edit the geometry of the currently selected feature.
   * If no feature is selected, it will not enable the interaction, as there would be nothing to modify.
   */
  function enableModifyInteraction() {
    if (!olMap) {
      return;
    }

    if (!focusedFeature.value) {
      console.log("A feature must first be selected");
      return;
    }

    disableAllInteractions();
    modifyInteraction.setActive(true);
    snapInteraction.setActive(true);
    focusMode.value = "edit";
  }

  /**
   * Clears the current feature selection and resets the focus mode to "none"
   */
  function removeFocus() {
    selectInteractions.clearSelection();
    focusedFeature.value = null;
    focusMode.value = "none";
    creatingOrEditingIterations.value = 0;

    console.log("Remaining interactions:", olMap.getInteractions());
  }

  /**
   * Enables the draw interaction for the specified geometry type, allowing users to draw new features on the map.
   * It also enables the snap interaction to snap to existing features while drawing.
   */
  function enableDrawInteraction(
    geometryType: "Point" | "LineString" | "Polygon" | "Circle",
  ) {
    if (!olMap) {
      return;
    }

    disableAllInteractions();
    removeFocus();
    focusMode.value = "create";

    // Note: the focusedFeature and focus mode will be set in the drawstart event listener of each draw interaction (above)
    switch (geometryType) {
      case "Point":
        drawPointInteraction.setActive(true);
        break;
      case "LineString":
        drawLineStringInteraction.setActive(true);
        break;
      case "Polygon":
        drawPolygonInteraction.setActive(true);
        break;
      case "Circle":
        drawCircleInteraction.setActive(true);
        break;
    }
    snapInteraction.setActive(true);
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

  /**
   * Verify if the internal vector layer used for drawing bears this specific uuid.
   */
  function bearsUuid(uuid: string) {
    return drawingVectorLayer.get("uuid") === uuid;
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
    focusedFeature,
    bearsUuid,
    // Expose the OL layer with a stable public type for declaration generation.
    drawingVectorLayer: drawingVectorLayer as unknown as VectorLayer,
    focusedFeatureMetrics,
    setFillColor,
    fillColor,
    setStrokeColor,
    strokeColor,
  };
}
