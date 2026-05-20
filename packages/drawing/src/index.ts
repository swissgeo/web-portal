// Composables
export { useOlDrawing } from "@/composables/olDrawing.composable";
export { useDrawingManager } from "@/composables/useDrawingManager";

// Store
export { useDrawingStore } from "@/stores/drawing";

// Utils
export {
  MARKER_ICONS,
  DEFAULT_MARKER_ICON,
  getMarkerIconById,
  type MarkerIcon,
} from "@/utils/markerIcons";
export { resolveFeatureId } from "@/utils/drawingUtils";

// Types
export type {
  DrawingFeatureAttributes,
  DrawingFeatureInfoPayload,
  DrawingHoverHintPayload,
  DrawingFeatureKind,
  DrawingFeatureMetadata,
  DrawingFeatureStyleProps,
  DrawingMode,
  MeasurementDrawingSubtype,
  TextAnchor,
} from "@/types";

// Components
export { default as OpenLayersDrawingLayer } from "@/components/OpenLayersDrawingLayer.vue";

// Layer matching
export { isDrawingLayer } from "@/utils/isDrawingLayer";
