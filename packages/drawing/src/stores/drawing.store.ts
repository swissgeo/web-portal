import type { Map as OlMap } from "ol";
import type { EventsKey } from "ol/events";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

import { useLayerStore } from "@swissgeo/layers";
import { DRAWING_LAYER_ID } from "@swissgeo/shared";
import { watchDebounced } from "@vueuse/core";
import { singleClick } from "ol/events/condition";
import KML from "ol/format/KML";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select.js";
import Snap from "ol/interaction/Snap";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import VectorSource from "ol/source/Vector";
import { defineStore, storeToRefs } from "pinia";
import { computed, markRaw, nextTick, ref, shallowRef, watch } from "vue";

import type { FocusedFeatureMetrics } from "../utils/drawingUtils";

import { computeFocusedFeatureMetrics } from "../utils/drawingUtils";

/**
 * Distance of tolearance in pixels for selecting a feature on the map.
 */
const SELECT_HIT_TOLERANCE = 5;

/**
 * The focus modes are kinds of states related to the drawing.
 * - "select" means that a feature is selected and can be edited or deleted.
 * - "create" means that a feature is being created, the user is in the process of drawing a new feature.
 * - "edit" means that a feature is being edited. It has already been created and the user is modifying it.
 * - "none" means that no feature is selected, created or edited.
 */
export const FOCUS_MODES = ["select", "create", "edit", "none"] as const;
export type FocusMode = (typeof FOCUS_MODES)[number];

export const useDrawingStore = defineStore("drawing", () => {
  const DRAWING_LAYER_UUID = crypto.randomUUID();
  const layerStore = useLayerStore();
  const { layers: layersInLayerStore } = storeToRefs(useLayerStore());
  // This particular handler is dealt with separately because it attached only to the geometry of the feature being drawn
  // at drawstart, and removed at drawend.
  let sketchGeometryHandler: EventsKey | null = null;

  /**
   * The map is mounted when the drawing layer is mounted.
   */
  let mountedMap: OlMap | null = null;

  // Store the keys of event handlers so that they can be removed later when the
  // component is unmounted or when the interactions are disabled.
  const handlersToRemove: EventsKey[] = [];

  const drawingVectorSource = markRaw(new VectorSource({ format: new KML() }));
  const drawingVectorLayer = markRaw(
    new VectorLayer({
      // These properties are used to identified the layer on the app logic (eg. layer tree)
      properties: {
        humanId: DRAWING_LAYER_ID,
        uuid: DRAWING_LAYER_UUID,
      },
      source: drawingVectorSource,

      // Temporary style
      style: null,
    }),
  );

  // The select interaction to select a feature on the map. This is used to set the focused feature and enable editing or show feature info.
  // Selecting multiple features is disabled
  const selectInteractions = markRaw(
    new Select({
      multi: false,
      hitTolerance: SELECT_HIT_TOLERANCE,
      style: null,
    }),
  );
  selectInteractions.setActive(false);

  // The modify interaction to edit the geometry of a selected feature.
  // It works in pair with the select interaction, as it modifies the currently selected feature.
  const modifyInteraction = markRaw(
    new Modify({
      features: selectInteractions.getFeatures(),
      style: {},
      deleteCondition: (event) =>
        event.originalEvent.shiftKey && singleClick(event),
    }),
  );
  modifyInteraction.setActive(false);

  // Interaction to snap to existing features when drawing or modifying
  const snapInteraction = markRaw(new Snap({ source: drawingVectorSource }));
  snapInteraction.setActive(false);

  // Interaction to draw points
  const drawPointInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Point",
      style: {},
    }),
  );
  drawPointInteraction.setActive(false);

  // Interaction to draw linestrings
  const drawLineStringInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "LineString",
      style: {},
    }),
  );
  drawLineStringInteraction.setActive(false);

  // Interaction to draw polygons
  const drawPolygonInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Polygon",
      style: {},
    }),
  );
  drawPolygonInteraction.setActive(false);

  // Interaction to draw circles
  const drawCircleInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Circle",
      style: {},
    }),
  );
  drawCircleInteraction.setActive(false);

  // Group draw interactions in an array to easily address them
  const allDrawInteractions = [
    drawPointInteraction,
    drawLineStringInteraction,
    drawPolygonInteraction,
    drawCircleInteraction,
  ];

  // All the features that have been created by the drawing module
  const focusedFeature = shallowRef<Feature<Geometry> | null>(null);
  const focusMode = ref<FocusMode>("none");

  /**
   * Keep tracks of the number of features that are part of the drawing layer/source
   */
  const numberOfFeatures = ref(0);

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
   * Can be used to track the adding or removing of the drawing layer from the layer store, which is the source of truth for the layers.
   */
  const isDrawingLayerInLayerStore = computed(() =>
    layersInLayerStore.value.some((layer) => layer.uuid === DRAWING_LAYER_UUID),
  );

  /**
   * Detects if the drawing layer has been removed from the layer store, and if so, unmounts it from the map.
   * Note: the layer store is the source of truth for the layers, and most importantly what is exposed to the UI.
   */
  watch(
    isDrawingLayerInLayerStore,
    (isDrawingLayerPresentInStore, wasDrawingLayerPresentInStore) => {
      if (!isDrawingLayerPresentInStore && wasDrawingLayerPresentInStore) {
        unmountDrawingLayer();
      }
    },
  );

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
      focusedFeatureMetrics.value = computeFocusedFeatureMetrics(
        focusedFeature.value,
      );
    },
    { immediate: true, debounce: 100 },
  );

  /**
   * Add the drawing layer to the map and to the layer store,
   * plus add the (disabled) interactions to the map that are necessary for the drawing feature to work.
   */
  function mountDrawingLayer(olMap: OlMap) {
    if (mountedMap === olMap) {
      return;
    }

    mountedMap = olMap;

    // As the map is available, all the interactions necessary to the drawing feature
    // are add, but all are disabled by default.
    mountedMap.addInteraction(modifyInteraction);
    mountedMap.addInteraction(drawPointInteraction);
    mountedMap.addInteraction(drawLineStringInteraction);
    mountedMap.addInteraction(drawPolygonInteraction);
    mountedMap.addInteraction(drawCircleInteraction);
    mountedMap.addInteraction(snapInteraction);
    mountedMap.addInteraction(selectInteractions);

    // Add the drawing layer to the map if it is not already there
    if (!mountedMap.getAllLayers().includes(drawingVectorLayer)) {
      mountedMap.addLayer(drawingVectorLayer);
    }

    // Add the drawing layer to the layer store if it is not already there
    if (!layerStore.getLayer(DRAWING_LAYER_UUID)) {
      layerStore.addLayer({
        uuid: DRAWING_LAYER_UUID,
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
    if (!mountedMap) {
      return;
    }
    // Remove all the interactions related to the drawing feature from the map
    mountedMap.removeInteraction(modifyInteraction);
    mountedMap.removeInteraction(drawPointInteraction);
    mountedMap.removeInteraction(drawLineStringInteraction);
    mountedMap.removeInteraction(drawPolygonInteraction);
    mountedMap.removeInteraction(drawCircleInteraction);
    mountedMap.removeInteraction(snapInteraction);
    mountedMap.removeInteraction(selectInteractions);

    // Remove the drawing layer from the map if it is there
    if (mountedMap.getAllLayers().includes(drawingVectorLayer)) {
      mountedMap.removeLayer(drawingVectorLayer);
    }

    // Remove the drawing layer from the layer store if it is there
    if (layerStore.getLayer(DRAWING_LAYER_UUID)) {
      layerStore.removeLayer(DRAWING_LAYER_UUID);
    }

    clearDrawingLayer();
    mountedMap = null;
  }

  /**
   * Disables all editing and select interactions on the map
   */
  function disableAllInteractions() {
    if (!mountedMap) {
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
   * Clear all the features from the drawing layer.
   */
  function clearDrawingLayer() {
    drawingVectorSource.clear();
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
   * When a feature is finished to be created or modified (typically with a double-click),
   * the focus is then switched to "select"
   */
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
   * Clears the current feature selection and resets the focus mode to "none"
   */
  function removeFocus() {
    selectInteractions.clearSelection();
    focusedFeature.value = null;
    focusMode.value = "none";
    creatingOrEditingIterations.value = 0;
  }

  /**
   * Enables the select interaction, allowing users to select features on the map.
   * This will also clear any existing selection and focused feature, as the select interaction starts fresh when enabled.
   */
  function enableSelectInteraction() {
    if (!mountedMap) {
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
    if (!mountedMap) {
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
   * Enables the draw interaction for the specified geometry type, allowing users to draw new features on the map.
   * It also enables the snap interaction to snap to existing features while drawing.
   */
  function enableDrawInteraction(
    geometryType: "Point" | "LineString" | "Polygon" | "Circle",
  ) {
    if (!mountedMap) {
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

  // TODO: to keep?
  // function removeAllHandlers() {
  //   unByKey(handlersToRemove);
  //   handlersToRemove.length = 0;
  // }

  return {
    DRAWING_LAYER_UUID,
    focusedFeature: focusedFeature,
    focusMode: focusMode,
    drawingVectorSource,
    drawingVectorLayer,
    modifyInteraction,
    drawPointInteraction,
    drawLineStringInteraction,
    drawPolygonInteraction,
    drawCircleInteraction,
    snapInteraction,
    selectInteractions,
    mountDrawingLayer,
    numberOfFeatures,
    focusedFeatureMetrics,
    unmountDrawingLayer,
    clearDrawingLayer,
    removeFocusedFeature,
    enableDrawInteraction,
    enableModifyInteraction,
    enableSelectInteraction,
    disableAllInteractions,
    removeFocus,
    creatingOrEditingIterations,
    isDrawingLayerInLayerStore,
  };
});
