import type VectorLayer from "ol/layer/Vector";

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
  };
}
