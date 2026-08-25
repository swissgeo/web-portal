import type VectorLayer from "ol/layer/Vector";

import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from "@swissgeo/shared";
import KML from "ol/format/KML";
import { storeToRefs } from "pinia";
import { computed, readonly, watch, triggerRef } from "vue";

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
  mapKmlStylesToFeatureProperties,
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
import {
  olFeatureToGeoJSON,
  olFeatureToKML,
  olFeatureToGPX,
  olFeatureToKMZ,
  exportFormatToMimeType,
} from "../utils/exportUtils";

export function useDrawing() {
  const drawingStore = useDrawingStore();
  const {
    focusedFeature,
    focusMode,
    numberOfFeatures,
    focusedFeatureMetrics,
    isDrawingLayerInLayerStore,
  } = storeToRefs(drawingStore);

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

  /**
   * Update the style of the formerly focused feature.
   */
  watch(
    focusedFeature,
    (newFocusedFeature, oldFocusedFeature) => {
      // If there was a previously focused feature that is different from the new one,
      // it means that we switched focus from one feature to another.
      // In this case, we reset the style of the old focused feature to the idle style and we return early,
      // as the new focused feature will be styled by the next iterations of the watch.
      if (oldFocusedFeature && oldFocusedFeature !== newFocusedFeature) {
        applyIdleStyle(oldFocusedFeature);
      }
    },
    { immediate: true },
  );

  /**
   * Update the style of the newly focused feature depending on focus and focus mode.
   */
  watch(
    [focusedFeature, focusMode],
    ([newFocusedFeature, newFocusMode]) => {
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
          // (not the creating/editing style, but the style that can later be modified and persisted)
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
   * Get the currently focused feature as a string in the specified format.
   */
  function serializeFocusedFeature(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): string | ArrayBuffer | null {
    if (!focusedFeature.value) {
      return null;
    }

    switch (format) {
      case "gpx-track":
        return olFeatureToGPX(focusedFeature.value, "track");
      case "gpx-route":
        return olFeatureToGPX(focusedFeature.value, "route");
      case "kml":
        return olFeatureToKML(focusedFeature.value);
      case "kmz":
        return olFeatureToKMZ(focusedFeature.value);
      case "geojson":
      default:
        return olFeatureToGeoJSON(focusedFeature.value);
    }
  }

  /**
   * Get the currently focused feature as a Blob in the specified format.
   */
  function serializeFocusedFeatureAsBlob(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): Blob | null {
    const serializedFeature = serializeFocusedFeature(format);
    if (!serializedFeature) {
      return null;
    }

    const blob = new Blob([serializedFeature], {
      type: exportFormatToMimeType[format],
    });
    return blob;
  }

  /**
   * Get all features in the drawing layer as a string in the specified format.
   */
  function serializeAllFeatures(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): string | ArrayBuffer | null {
    if (!drawingStore.drawingVectorSource) {
      return null;
    }

    const features = drawingStore.drawingVectorSource.getFeatures();

    switch (format) {
      case "gpx-track":
        return olFeatureToGPX(features, "track");
      case "gpx-route":
        return olFeatureToGPX(features, "route");
      case "kml":
        return olFeatureToKML(features);
      case "kmz":
        return olFeatureToKMZ(features);
      case "geojson":
      default:
        return olFeatureToGeoJSON(features);
    }
  }

  /**
   * Export all features in the drawing layer as a Blob in the specified format.
   */
  function serializeAllFeaturesAsBlob(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): Blob | null {
    const serializedFeatures = serializeAllFeatures(format);
    if (!serializedFeatures) {
      return null;
    }

    const blob = new Blob([serializedFeatures], {
      type: exportFormatToMimeType[format],
    });
    return blob;
  }

  function importKml(kmlString: string): void {
    const kmlFormat = new KML();
    const features = kmlFormat.readFeatures(kmlString, {
      featureProjection: EPSG_2056_CH1903,
      dataProjection: EPSG_4326_WGS84,
    });
    for (const feature of features) {
      mapKmlStylesToFeatureProperties(feature);
      initializeMetadataProperties(feature);
      applyIdleStyle(feature);
    }
    drawingStore.drawingVectorSource.addFeatures(features);
  }

  return {
    disableAllInteractions: drawingStore.disableAllInteractions,
    enableSelectInteraction: drawingStore.enableSelectInteraction,
    enableModifyInteraction: drawingStore.enableModifyInteraction,
    removeFocus: drawingStore.removeFocus,
    enableDrawInteraction: drawingStore.enableDrawInteraction,
    removeFocusedFeature: drawingStore.removeFocusedFeature,
    mountDrawingLayer: drawingStore.mountDrawingLayer,
    unmountDrawingLayer: drawingStore.unmountDrawingLayer,
    clearDrawingLayer: drawingStore.clearDrawingLayer,
    isDrawingLayerInLayerStore: readonly(isDrawingLayerInLayerStore),
    focusedFeature: readonly(focusedFeature),
    numberOfFeatures: readonly(numberOfFeatures),
    focusMode: readonly(focusMode),
    focusedFeatureType: readonly(focusedFeatureType),
    // Expose the OL layer with a stable public type for declaration generation.
    drawingVectorLayer: drawingStore.drawingVectorLayer as VectorLayer,
    focusedFeatureMetrics: readonly(focusedFeatureMetrics),
    fillColor,
    strokeColor,
    strokeWidth,
    pointRadius,
    pointColor,
    title,
    description,
    DRAWING_LAYER_UUID: drawingStore.DRAWING_LAYER_UUID,
    serializeFocusedFeature,
    serializeFocusedFeatureAsBlob,
    serializeAllFeatures,
    serializeAllFeaturesAsBlob,
    importKml,
  };
}
