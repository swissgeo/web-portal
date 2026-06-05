import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select.js";
import Snap from "ol/interaction/Snap";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { defineStore } from "pinia";
import { markRaw, ref } from "vue";

export const FOCUS_MODES = ["read", "create", "edit", "none"] as const;
export type FocusMode = (typeof FOCUS_MODES)[number];

// TODO rename when ready
export const useDrawingStore2 = defineStore("drawing2", () => {
  const drawingVectorSource = markRaw(new VectorSource());
  const drawingVectorLayer = markRaw(
    new VectorLayer({
      source: drawingVectorSource,

      // Temporary style
      style: {
        "fill-color": "rgba(255, 255, 255, 0.2)",
        "stroke-color": "#ffcc33",
        "stroke-width": 2,
        "circle-radius": 7,
        "circle-fill-color": "#ffcc33",
      },
    }),
  );

  // The select interaction to select a feature on the map. This is used to set the focused feature and enable editing or show feature info.
  // Selecting multiple features is disabled
  const selectInteractions = markRaw(new Select({ multi: false }));

  // The modify interaction to edit the geometry of a selected feature.
  // It works in pair with the select interaction, as it modifies the currently selected feature.
  const modifyInteraction = markRaw(
    new Modify({ features: selectInteractions.getFeatures() }),
  );

  // Interaction to snap to existing features when drawing or modifying
  const snapInteraction = markRaw(new Snap({ source: drawingVectorSource }));

  // Interaction to draw points
  const drawPointInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Point",
    }),
  );

  // Interaction to draw linestrings
  const drawLineStringInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "LineString",
    }),
  );

  // Interaction to draw polygons
  const drawPolygonInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Polygon",
    }),
  );

  // Interaction to draw circles
  const drawCircleInteraction = markRaw(
    new Draw({
      source: drawingVectorSource,
      type: "Circle",
    }),
  );

  // All the features that have been created by the drawing module
  const focusedFeature = ref<Feature<Geometry> | null>(null);
  const focusMode = ref<FocusMode>("none");

  return {
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
  };
});
