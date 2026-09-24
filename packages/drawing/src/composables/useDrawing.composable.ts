import type VectorLayer from "ol/layer/Vector";

import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from "@swissgeo/shared";
import KML from "ol/format/KML";
import { storeToRefs } from "pinia";
import { computed, readonly, watch, triggerRef } from "vue";

import type {
  IconSize,
  RelativePlacement,
  TextSize,
} from "../utils/drawingStyleCommon";

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
  getIconUrlStyleProperty,
  setIconUrlStyleProperty,
  getShowTitleStyleProperty,
  setShowTitleStyleProperty,
  getShowDescriptionStyleProperty,
  setShowDescriptionStyleProperty,
  getShowIconStyleProperty,
  setShowIconStyleProperty,
  setIconSizeStyleProperty,
  getIconSizeStyleProperty,
  getIconAnchorStyleProperty,
  setIconAnchorStyleProperty,
  getTextBaselineStyleProperty,
  setTextBaselineStyleProperty,
  setTextAlignStyleProperty,
  getTextAlignStyleProperty,
  getTextColorStyleProperty,
  setTextColorStyleProperty,
  setTextHaloColorStyleProperty,
  getTextHaloColorStyleProperty,
  setTextSizeStyleProperty,
  getTextSizeStyleProperty,
  setTextPlacementStyleProperty,
  getTextPlacementStyleProperty,
  getIconSetNameStyleProperty,
  setIconSetNameStyleProperty,
  setIconColorStyleProperty,
  getIconColorStyleProperty,
  setIconNameStyleProperty,
  getIconNameStyleProperty,
} from "../utils/drawingStyleCommon";
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
   * Updates the icon URL of the focused feature and triggers a reactivity update.
   * (Currently only for Point features)
   */
  const iconUrl = computed({
    get() {
      return getIconUrlStyleProperty(focusedFeature.value);
    },

    set(newUrl: string) {
      setIconUrlStyleProperty(focusedFeature.value, newUrl);
      // If a icon URL is set, we want to ensure that the icon is shown.
      setShowIconStyleProperty(focusedFeature.value, !!newUrl);
      triggerRef(focusedFeature);
    },
  });

  const iconSetName = computed({
    get() {
      return getIconSetNameStyleProperty(focusedFeature.value);
    },

    set(newName: string) {
      setIconSetNameStyleProperty(focusedFeature.value, newName);
      triggerRef(focusedFeature);
    },
  });

  const iconName = computed({
    get() {
      return getIconNameStyleProperty(focusedFeature.value);
    },

    set(newName: string) {
      setIconNameStyleProperty(focusedFeature.value, newName);
      // Associating a new icon from the Icon Service automatically resets the icon URL that may come from a hardcoded URL within a KML file.
      setIconUrlStyleProperty(focusedFeature.value, "");
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the visibility of the title.
   * (Currently only for Point features)
   */
  const showTitle = computed({
    get() {
      return getShowTitleStyleProperty(focusedFeature.value);
    },

    set(show: boolean) {
      setShowTitleStyleProperty(focusedFeature.value, show);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the visibility of the description.
   * (Currently only for Point features)
   */
  const showDescription = computed({
    get() {
      return getShowDescriptionStyleProperty(focusedFeature.value);
    },

    set(show: boolean) {
      setShowDescriptionStyleProperty(focusedFeature.value, show);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the visibility of the icon.
   * (Currently only for Point features)
   */
  const showIcon = computed({
    get() {
      return getShowIconStyleProperty(focusedFeature.value);
    },

    set(show: boolean) {
      setShowIconStyleProperty(focusedFeature.value, show);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the size of the icon.
   * (Currently only for Point features)
   */
  const iconSize = computed({
    get() {
      return getIconSizeStyleProperty(focusedFeature.value);
    },

    set(size: IconSize) {
      setIconSizeStyleProperty(focusedFeature.value, size);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Color of the icon, when the icon set supports colorization.
   */
  const iconColor = computed({
    get() {
      return getIconColorStyleProperty(focusedFeature.value);
    },

    set(color: string) {
      setIconColorStyleProperty(focusedFeature.value, color);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the anchor point of the icon.
   * (Currently only for Point features)
   */
  const iconAnchor = computed({
    get() {
      return getIconAnchorStyleProperty(focusedFeature.value);
    },

    set(anchor: [number, number]) {
      setIconAnchorStyleProperty(focusedFeature.value, anchor);
      triggerRef(focusedFeature);
    },
  });

  const textSize = computed({
    get() {
      return getTextSizeStyleProperty(focusedFeature.value);
    },

    set(size: TextSize) {
      setTextSizeStyleProperty(focusedFeature.value, size);
      triggerRef(focusedFeature);
    },
  });

  const textColor = computed({
    get() {
      return getTextColorStyleProperty(focusedFeature.value);
    },

    set(newColor: string) {
      setTextColorStyleProperty(focusedFeature.value, newColor);
      // Since the text color is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  const textHaloColor = computed({
    get() {
      return getTextHaloColorStyleProperty(focusedFeature.value);
    },

    set(newColor: string) {
      setTextHaloColorStyleProperty(focusedFeature.value, newColor);
      // Since the text halo color is a style property, we need to trigger the ref to ensure that the change is reactive and updates any watchers or computed properties that depend on it.
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the text baseline of the focused feature.
   * (Currently only for Point features)
   */
  const textBaseline = computed({
    get() {
      return getTextBaselineStyleProperty(focusedFeature.value);
    },

    set(baseline: "top" | "middle" | "bottom") {
      setTextBaselineStyleProperty(focusedFeature.value, baseline);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the text alignment of the focused feature.
   * (Currently only for Point features)
   */
  const textAlign = computed({
    get() {
      return getTextAlignStyleProperty(focusedFeature.value);
    },

    set(align: "left" | "center" | "right") {
      setTextAlignStyleProperty(focusedFeature.value, align);
      triggerRef(focusedFeature);
    },
  });

  /**
   * Getters and setters for the text placement of the focused feature.
   * (Currently only for Point features)
   * The text placement determines where the text is placed relative to the point feature.
   */
  const textPlacement = computed({
    get() {
      return getTextPlacementStyleProperty(focusedFeature.value);
    },

    set(placement: RelativePlacement) {
      setTextPlacementStyleProperty(focusedFeature.value, placement);
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
   * Serialize the currently focused feature in the specified format. KMZ is
   * asynchronous because its point icons are downloaded into the archive.
   */
  function serializeFocusedFeature(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): string | Promise<ArrayBuffer> | null {
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
  async function serializeFocusedFeatureAsBlob(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): Promise<Blob | null> {
    const serializedFeature = await serializeFocusedFeature(format);
    if (!serializedFeature) {
      return null;
    }

    const blob = new Blob([serializedFeature], {
      type: exportFormatToMimeType[format],
    });
    return blob;
  }

  /**
   * Serialize all features in the drawing layer in the specified format. KMZ
   * is asynchronous because its point icons are downloaded into the archive.
   */
  function serializeAllFeatures(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): string | Promise<ArrayBuffer> | null {
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
  async function serializeAllFeaturesAsBlob(
    format: "geojson" | "gpx-track" | "gpx-route" | "kml" | "kmz" = "geojson",
  ): Promise<Blob | null> {
    const serializedFeatures = await serializeAllFeatures(format);
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
      // Adds Swissgeo metadata properties for drawing features with their default values
      initializeMetadataProperties(feature);
      initializeStyleProperties(feature);
      mapKmlStylesToFeatureProperties(feature);
      applyIdleStyle(feature);

      // In case a feature has already been imported, it is needed to first remove the previous version
      // and only then add the new version
      const featureId = feature.getId();
      if (featureId) {
        const featureAlreadyInSource =
          drawingStore.drawingVectorSource.getFeatureById(featureId);
        if (featureAlreadyInSource) {
          drawingStore.drawingVectorSource.removeFeature(
            featureAlreadyInSource,
          );
        }
      }
      drawingStore.drawingVectorSource.addFeature(feature);
    }
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
    iconUrl,
    showTitle,
    showDescription,
    showIcon,
    iconSize,
    iconAnchor,
    textBaseline,
    textAlign,
    textColor,
    textHaloColor,
    textSize,
    textPlacement,
    iconSetName,
    iconName,
    iconColor,
    DRAWING_LAYER_UUID: drawingStore.DRAWING_LAYER_UUID,
    serializeFocusedFeature,
    serializeFocusedFeatureAsBlob,
    serializeAllFeatures,
    serializeAllFeaturesAsBlob,
    importKml,
  };
}
