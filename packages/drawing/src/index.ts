// Utils
export {
  MARKER_ICONS,
  DEFAULT_MARKER_ICON,
  getMarkerIconById,
  type MarkerIcon,
} from "@/utils/markerIcons";

export { useDrawing } from "@/composables/useDrawing.composable";
export {
  type CircleMetrics,
  type LineStringMetrics,
  type PolygonMetrics,
} from "@/utils/drawingUtils";
export {
  getFeatureTitle,
  getFeatureDescription,
} from "@/utils/drawingMetadata";
export {
  type RelativePlacement,
  ICON_SIZE,
  TEXT_SIZE,
} from "@/utils/drawingStyleCommon";
export { useIconsStore } from "@/stores/icons.store";
export { Icon } from "@/core/Icon";
export { IconSet } from "@/core/IconSet";
