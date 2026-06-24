import type { Map as OlMap } from "ol";
import type { Coordinate } from "ol/coordinate";
import type { EventsKey } from "ol/events";
import type Feature from "ol/Feature";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";
import type VectorLayer from "ol/layer/Vector";

import { registerProj4, WGS84 } from "@swissgeo/coordinates";
import { useLayerStore } from "@swissgeo/layers";
import { watchDebounced } from "@vueuse/core";
import { unByKey } from "ol/Observable";
import { storeToRefs } from "pinia";
import proj4 from "proj4";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  readonly,
  ref,
  watch,
  triggerRef,
} from "vue";

import { useDrawingStore } from "../stores/drawing.store";
import {
  getFeatureDescription,
  getFeatureTitle,
  initializeMetadataProperties,
  setFeatureDescription,
  setFeatureTitle,
} from "../utils/drawingMetadata";
import {
  applyIdleStyle,
  applyEditingStyle,
  applySelectedStyle,
  initializeStyleProperties,
  setFeatureFillColorStyleProperty,
  setFeatureStrokeColorStyleProperty,
  getFeatureFillColorStyleProperty,
  getFeatureStrokeColorStyleProperty,
  getFeatureStrokeWidthStyleProperty,
  getFeaturePointRadiusStyleProperty,
  getFeaturePointColorStyleProperty,
  setFeatureStrokeWidthStyleProperty,
  setFeaturePointRadiusStyleProperty,
  setFeaturePointColorStyleProperty,
} from "../utils/drawingStyle";
import { getLinearRingLength } from "../utils/drawingUtils";

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
  const drawingStore = useDrawingStore();
  const { focusedFeature, focusMode } = storeToRefs(drawingStore);
  const { layers: layersInLayerStore } = storeToRefs(useLayerStore());
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

  // Store the keys of event handlers so that they can be removed later when the
  // component is unmounted or when the interactions are disabled.
  const handlersToRemove: EventsKey[] = [];

  // This particular handler is dealt with separately because it attached only to the geometry of the feature being drawn
  // at drawstart, and removed at drawend.
  let sketchGeometryHandler: EventsKey | null = null;

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

  /**
   * Style properties of the focused feature.
   * They are "computed" with two-way binding so that they can source their values
   * from the OL features rather than store them.
   */
  const fillColor = computed({
    get() {
      return getFeatureFillColorStyleProperty(focusedFeature.value);
    },

    set(newColor: string) {
      setFeatureFillColorStyleProperty(focusedFeature.value, newColor);
      // Since the fill color is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const strokeColor = computed({
    get() {
      return getFeatureStrokeColorStyleProperty(focusedFeature.value);
    },

    set(newColor: string) {
      setFeatureStrokeColorStyleProperty(focusedFeature.value, newColor);
      // Since the stroke color is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const strokeWidth = computed({
    get() {
      return getFeatureStrokeWidthStyleProperty(focusedFeature.value);
    },

    set(newWidth: number) {
      setFeatureStrokeWidthStyleProperty(focusedFeature.value, newWidth);

      // Since the stroke width is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const pointRadius = computed({
    get() {
      return getFeaturePointRadiusStyleProperty(focusedFeature.value);
    },

    set(newRadius: number) {
      setFeaturePointRadiusStyleProperty(focusedFeature.value, newRadius);
      // Since the point radius is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const pointColor = computed({
    get() {
      return getFeaturePointColorStyleProperty(focusedFeature.value);
    },

    set(newColor: string) {
      setFeaturePointColorStyleProperty(focusedFeature.value, newColor);
      // Since the point color is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  /**
   * Non-style properties of the focused feature, as states.
   * They are "computed" with two-way binding so that they can source their values
   * from the OL features rather than store them.
   */
  const title = computed({
    get() {
      if (!focusedFeature.value) {
        return "";
      }
      return getFeatureTitle(focusedFeature.value);
    },

    set(newTitle: string) {
      if (!focusedFeature.value) {
        return;
      }
      setFeatureTitle(focusedFeature.value, newTitle);
      // Since the title is a property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const description = computed({
    get() {
      if (!focusedFeature.value) {
        return "";
      }
      return getFeatureDescription(focusedFeature.value);
    },

    set(newDescription: string) {
      if (!focusedFeature.value) {
        return;
      }
      setFeatureDescription(focusedFeature.value, newDescription);
      // Since the description is a property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  /**
   * Can be used to track the adding or removing of the drawing layer from the layer store, which is the source of truth for the layers.
   */
  const isDrawingLayerInLayerStore = computed(() => 
    layersInLayerStore.value.some(
      (layer) => layer.uuid === drawingVectorLayer.get("uuid"),
    ));

  /**
   * Watch for changes that occurs in the vector layer of if the focus has changed.
   * This can be about a feature being added/removed/modified or even a property of a feature
   * such as a color.
   * Note: this is debounced to avoid too many updates when the user is drawing or editing a feature.
   */
  watchDebounced(
    [creatingOrEditingIterations, focusedFeature],
    () => {
      // Update the number of features and the metrics of the focused feature
      numberOfFeatures.value = drawingVectorSource.getFeatures().length;

      // Update the metrics of the focused feature (if focused)
      focusedFeatureMetrics.value = computeFocusedFeatureMetrics();
    },
    { immediate: true, debounce: 100 },
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

  /**
   * Add the drawing layer to the map and to the layer store,
   * plus add the (disabled) interactions to the map that are necessary for the drawing feature to work.
   */
  function mountDrawingLayer() {
    // As the map is available, all the interactions necessary to the drawing feature
    // are add, but all are disabled by default.
    olMap.addInteraction(modifyInteraction);
    olMap.addInteraction(drawPointInteraction);
    olMap.addInteraction(drawLineStringInteraction);
    olMap.addInteraction(drawPolygonInteraction);
    olMap.addInteraction(drawCircleInteraction);
    olMap.addInteraction(snapInteraction);
    olMap.addInteraction(selectInteractions);

    // Add the drawing layer to the map if it is not already there
    if (!olMap.getAllLayers().includes(drawingVectorLayer)) {
      olMap.addLayer(drawingVectorLayer);
    }
    
    // Add the drawing layer to the layer store if it is not already there
    if (!layerStore.getLayer(drawingVectorLayer.get("uuid"))) {
      layerStore.addLayer({
        uuid: drawingVectorLayer.get("uuid"),
        humanId: drawingVectorLayer.get("humanId"),
        type: "kml",
        isLoading: false,
        info: {
          displayName: "Drawing layer",
          abstract: "This layer is for drawings",
        },
      });
    }
  }

  /**
   * Remove the drawing layer from the map and from the layer store,
   * and remove all the interactions related to the drawing feature from the map.
   */
  function unmountDrawingLayer() {
    // Remove all the interactions related to the drawing feature from the map
    olMap.removeInteraction(modifyInteraction);
    olMap.removeInteraction(drawPointInteraction);
    olMap.removeInteraction(drawLineStringInteraction);
    olMap.removeInteraction(drawPolygonInteraction);
    olMap.removeInteraction(drawCircleInteraction);
    olMap.removeInteraction(snapInteraction);
    olMap.removeInteraction(selectInteractions);

    // Remove the drawing layer from the map if it is there
    if (olMap.getAllLayers().includes(drawingVectorLayer)) {
      olMap.removeLayer(drawingVectorLayer);
    }

    // Remove the drawing layer from the layer store if it is there
    if (layerStore.getLayer(drawingVectorLayer.get("uuid"))) {
      layerStore.removeLayer(drawingVectorLayer.get("uuid"));
    }

    clearDrawingLayer();
  }

  /**
   * Clear all the features from the drawing layer.
   */
  function clearDrawingLayer() {
    drawingVectorSource.clear();
  }

  onMounted(() => {
    numberOfFeatures.value = drawingVectorSource.getFeatures().length;
  });

  /**
   * This callback is driving the update of a few states, including:
   * - the number of features in the drawing layer
   * - the metrics of the focused feature (e.g. length, area, etc.)
   * - some styling properties such as fill and stroke color
   * - possibly more in the future.
   */
  let handler = drawingVectorSource.on("changefeature", () => {
    creatingOrEditingIterations.value++;
  });

  // Keeping track of handlers to remove them at unmount, so that they are not added multiple times
  // (which would cause the event to fire multiple times)
  handlersToRemove.push(handler);

  /**
   * When a feature is selected, set it as the focused feature and update the focus mode to "read".
   * When the selection is cleared, reset the focused feature and set the focus mode to "none".
   */
  handler = selectInteractions.on("select", (event) => {
    const selectedFeatures = event.target.getFeatures().getArray();
    if (selectedFeatures.length > 0) {
      focusedFeature.value = selectedFeatures[0];
      focusMode.value = "select";
    } else {
      focusedFeature.value = null;
      focusMode.value = "none";
    }
  });
  handlersToRemove.push(handler);

  /**
   * Update the style of the feature depending on focus and focus mode.
   */
  watch(
    [focusedFeature, focusMode],
    ([newFocusedFeature, newFocusMode], [oldFocusedFeature, _oldFocusMode]) => {
      // If there was a previously focused feature that is different from the new one,
      // it means that we switched focus from one feature to another.
      // In this case, we reset the style of the old focused feature to the idle style and we return early,
      // as the new focused feature will be styled by the next iterations of the watch.
      if (oldFocusedFeature && oldFocusedFeature !== newFocusedFeature) {
        applyIdleStyle(oldFocusedFeature);
      }

      // If no feature is currently focused, we don't need to do anything
      if (!newFocusedFeature) {
        return;
      }

      // From now on, a feature is selected. The style is applied according to the focus mode.
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

          // Initialize the non-style metadata properties (title, description) for the new feature
          initializeMetadataProperties(focusedFeature.value);

        // Note: no break here, as the creating style is the same as the editing style for now
        // eslint-disable-next-line no-fallthrough
        case "edit":
          // Apply the style for creating/editing to the feature,
          // so that it is visually different while being created/edited.
          applyEditingStyle(focusedFeature.value);
          break;
      }
    },
    { immediate: true },
  );

  /**
   * Detects if the drawing layer has been removed from the layer store, and if so, unmounts it from the map.
   * Note: the layer store is the source of truth for the layers, and mostl importantly what is exposed to the UI.
   */
  watch(isDrawingLayerInLayerStore,
    (isDrawingLayerPresentInStore, wasDrawingLayerPresentInStore) => {      
      if (!isDrawingLayerPresentInStore && wasDrawingLayerPresentInStore) {
        unmountDrawingLayer();
      }
    }
  );

  // When a feature is finished to be created or modified (tyipically with a double-click),
  // the focus is then switched to "none"
  allDrawInteractions.forEach((interaction) => {
    /**
     * As soon as the drawing has started, the feature being created takes the seat as focusedFeature
     * and the focus mode is set to "create".
     */
    handler = interaction.on("drawstart", (event) => {
      focusedFeature.value = event.feature;

      const geometry = event.feature.getGeometry();
      if (!geometry) {
        return;
      }

      sketchGeometryHandler = geometry.on("change", () => {
        creatingOrEditingIterations.value++;
      });
    });
    handlersToRemove.push(handler);

    /**
     * When a drawing ends (in create mode), the interactions are all disabled.
     */
    handler = interaction.on("drawend", async () => {
      if (sketchGeometryHandler) {
        unByKey(sketchGeometryHandler);
        sketchGeometryHandler = null;
      }

      // the disabling of all interactions is delayed to avoid conflicts with the internal logic of OL,
      // because is disabled immediately at "drawend", the DoubleClick event would trigger as part of validating a drawing.
      await nextTick(() => {
        disableAllInteractions();

        focusOnFinishedFeature();
      });
    });
    handlersToRemove.push(handler);
  });

  /**
   * Disables all editing and select interactions on the map
   */
  function disableAllInteractions() {
    if (!olMap) {
      return;
    }

    // in case a sketch geometry handler is still active, we remove it to avoid memory leaks and unexpected behavior
    if (sketchGeometryHandler) {
      unByKey(sketchGeometryHandler);
      sketchGeometryHandler = null;
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
  }

  /**
   * When a feature is just finished, we keep it under focus so that the user can modify its properties if needed,
   * or toggle the geometry edition mode faster than having to re-select it.
   */
  function focusOnFinishedFeature() {
    selectInteractions.setActive(true);
    selectInteractions.selectFeature(focusedFeature.value as Feature<Geometry>);
    focusMode.value = "select";
    creatingOrEditingIterations.value = 0;
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

  function removeAllHandlers() {
    unByKey(handlersToRemove);
    handlersToRemove.length = 0;
  }

  onUnmounted(() => {
    removeAllHandlers();
  });

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
    fillColor,
    strokeColor,
    strokeWidth,
    pointRadius,
    pointColor,
    title,
    description,
    mountDrawingLayer,
    unmountDrawingLayer,
    clearDrawingLayer,
    isDrawingLayerInLayerStore,
  };
}
