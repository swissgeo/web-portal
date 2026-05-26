import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text as TextStyle,
} from "ol/style";

/**
 * Shared configuration for text feature styles.
 * Used by both @swissgeo/drawing and @swissgeo/map.
 */
export const TEXT_FEATURE_FONT = "16px sans-serif";
export const TEXT_FEATURE_FILL_COLOR = "#000";
export const TEXT_FEATURE_STROKE_COLOR = "#fff";
export const TEXT_FEATURE_STROKE_WIDTH = 3;
export const INVISIBLE_POINT_RADIUS = 0;
export const INVISIBLE_POINT_FILL_COLOR = "rgba(0, 0, 0, 0)";

/**
 * Creates a TextStyle for text features using the shared configuration.
 */
export function createTextStyle(text: string): TextStyle {
  return new TextStyle({
    text,
    font: TEXT_FEATURE_FONT,
    fill: new Fill({
      color: TEXT_FEATURE_FILL_COLOR,
    }),
    stroke: new Stroke({
      color: TEXT_FEATURE_STROKE_COLOR,
      width: TEXT_FEATURE_STROKE_WIDTH,
    }),
    textAlign: "center",
    textBaseline: "middle",
    offsetY: 0,
  });
}

/**
 * Creates an OpenLayers Style for a text feature.
 * Uses an invisible point marker with a visible text label.
 */
export function createTextFeatureStyle(text: string): Style {
  return new Style({
    image: new CircleStyle({
      radius: INVISIBLE_POINT_RADIUS,
      fill: new Fill({
        color: INVISIBLE_POINT_FILL_COLOR,
      }),
    }),
    text: createTextStyle(text),
  });
}
