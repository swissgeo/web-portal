import type { Feature } from "ol";
import type { Geometry } from "ol/geom";
import type VectorLayer from "ol/layer/Vector";

import { registerProj4 } from "@swissgeo/coordinates";
import { register } from "ol/proj/proj4";
import { defineStore } from "pinia";
import proj4 from "proj4";
import { computed, ref, shallowRef } from "vue";

import type {
  DrawingFeatureAttributes,
  DrawingFeatureInfoPayload,
  DrawingMode,
  MeasurementDrawingSubtype,
} from "@/types";

import {
  DEFAULT_DRAWING_NAME,
  ensureFeatureAttributes,
  extractDrawingNameFromKML,
  sanitizeDrawingName,
  updateFeatureAttributes,
} from "@/utils/drawingUtils";
import { DEFAULT_MARKER_ICON } from "@/utils/markerIcons";

registerProj4(proj4);
register(proj4);

export const useDrawingStore = defineStore("drawing", () => {
  const drawingMode = ref<DrawingMode>("None");
  const drawingName = ref(DEFAULT_DRAWING_NAME);

  const isDrawing = ref(false);
  const measurementSubtype = ref<MeasurementDrawingSubtype>("Radius");
  const selectedFeatureId = ref<string | null>(null);
  const selectedFeatureInfo = ref<DrawingFeatureInfoPayload | null>(null);
  const drawingLayerUuid = ref<string | null>();
  const drawingKMLLayerUuid = ref<string | null>();
  const drawingFeatures = ref<Feature<Geometry>[]>([]);
  const featureCount = computed(() => drawingFeatures.value.length);
  const selectedIconId = ref<string>(DEFAULT_MARKER_ICON.id);
  const olLayer = shallowRef<VectorLayer | undefined>(undefined);

  function resolveFeatureContext() {
    return {
      drawingMode: drawingMode.value,
      measurementSubtype: measurementSubtype.value,
    };
  }

  function setDrawingMode(mode: DrawingMode) {
    drawingMode.value = mode;
  }

  function clearDrawingMode() {
    drawingMode.value = "None";
  }

  function setDrawingName(name: string) {
    drawingName.value = sanitizeDrawingName(name);
  }

  function resetDrawingName() {
    drawingName.value = DEFAULT_DRAWING_NAME;
  }

  function toggleDrawing() {
    isDrawing.value = !isDrawing.value;
  }

  function setDrawingEnabled(enabled: boolean) {
    isDrawing.value = enabled;
  }

  function setMeasurementSubtype(subtype: MeasurementDrawingSubtype) {
    measurementSubtype.value = subtype;
  }

  function resetMeasurementSubtype() {
    measurementSubtype.value = "Radius";
  }

  function setSelectedFeatureId(featureId: string | null) {
    selectedFeatureId.value = featureId;
  }

  function setSelectedFeatureInfo(info: DrawingFeatureInfoPayload | null) {
    selectedFeatureInfo.value = info;
  }

  function clearPassiveSelection() {
    selectedFeatureId.value = null;
    selectedFeatureInfo.value = null;
  }

  function ensureDrawingFeatureAttributes(
    feature: Feature<Geometry>,
  ): DrawingFeatureAttributes {
    return ensureFeatureAttributes(feature, resolveFeatureContext());
  }

  function updateDrawingFeatureAttributes(
    feature: Feature<Geometry>,
    attributes: Partial<DrawingFeatureAttributes>,
  ) {
    updateFeatureAttributes(feature, attributes, resolveFeatureContext());
  }

  function addDrawingFeature(feature: Feature<Geometry>) {
    ensureDrawingFeatureAttributes(feature);
    drawingFeatures.value.push(feature);
  }

  function setDrawingLayerUuid(uuid: string) {
    drawingLayerUuid.value = uuid;
  }

  function resetDrawingLayerUuid() {
    drawingLayerUuid.value = null;
  }

  function setDrawingKMLLayerUuid(uuid: string) {
    drawingKMLLayerUuid.value = uuid;
  }

  function clearDrawingFeatures() {
    drawingFeatures.value = [];
    clearPassiveSelection();
  }

  function setDrawingFeatures(features: Feature<Geometry>[]) {
    drawingFeatures.value = features;
  }

  function setOlLayer(layer: VectorLayer) {
    olLayer.value = layer;
  }

  function setSelectedIconId(iconId: string) {
    selectedIconId.value = iconId;
  }

  return {
    olLayer,
    featureCount,
    measurementSubtype,
    selectedFeatureId,
    selectedFeatureInfo,
    drawingName,
    drawingLayerUuid,
    drawingKMLLayerUuid,
    drawingFeatures,
    isDrawing,
    drawingMode,
    selectedIconId,

    addDrawingFeature,
    setDrawingMode,
    clearDrawingMode,
    setDrawingName,
    resetDrawingName,
    toggleDrawing,
    setDrawingEnabled,
    setMeasurementSubtype,
    resetMeasurementSubtype,
    setSelectedFeatureId,
    setSelectedFeatureInfo,
    clearPassiveSelection,
    ensureFeatureAttributes: ensureDrawingFeatureAttributes,
    updateFeatureAttributes: updateDrawingFeatureAttributes,
    setDrawingLayerUuid,
    resetDrawingLayerUuid,
    clearDrawingFeatures,
    setDrawingFeatures,
    setOlLayer,
    setDrawingKMLLayerUuid,
    setSelectedIconId,

    extractDrawingNameFromKML,
  };
});
