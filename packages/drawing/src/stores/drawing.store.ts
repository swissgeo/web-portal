import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

import { DRAWING_LAYER_ID } from "@swissgeo/shared";
import KML from "ol/format/KML";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select.js";
import Snap from "ol/interaction/Snap";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { defineStore } from "pinia";
import { markRaw, ref, shallowRef } from "vue";

export const FOCUS_MODES = ["select", "create", "edit", "none"] as const;
export type FocusMode = (typeof FOCUS_MODES)[number];

// TODO rename when ready
export const useDrawingStore = defineStore("drawing", () => {
  const drawingVectorSource = markRaw(new VectorSource({ format: new KML() }));
  const drawingVectorLayer = markRaw(
    new VectorLayer({
      // These properties are used to identified the layer on the app logic (eg. layer tree)
      properties: {
        humanId: DRAWING_LAYER_ID,
        uuid: crypto.randomUUID(),
      },
      source: drawingVectorSource,

      // Temporary style
      style: null,
    }),
  );

  // The select interaction to select a feature on the map. This is used to set the focused feature and enable editing or show feature info.
  // Selecting multiple features is disabled
  const selectInteractions = markRaw(
    new Select({ multi: false, hitTolerance: 5, style: null }),
  );
  selectInteractions.setActive(false);

  // The modify interaction to edit the geometry of a selected feature.
  // It works in pair with the select interaction, as it modifies the currently selected feature.
  const modifyInteraction = markRaw(
    new Modify({ features: selectInteractions.getFeatures(), style: {} }),
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

  // All the features that have been created by the drawing module
  const focusedFeature = shallowRef<Feature<Geometry> | null>(null);
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
