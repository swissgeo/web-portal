import type { Feature } from "ol";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";

/**
 * names of the properties used to store the style information in the feature's properties
 */
export const STYLE_KEY = "style";
export const FILL_COLOR_KEY = "fillColor";
export const STROKE_COLOR_KEY = "strokeColor";
export const STROKE_WIDTH_KEY = "strokeWidth";
export const POINT_RADIUS_KEY = "pointRadius";
export const POINT_COLOR_KEY = "pointColor";

/**
 * Default values for the style properties.
 * Note: these are not for the style "as creating/editing" but for the initial style of a feature when it is created.
 */
export const DEFAULT_STROKE_COLOR = "#ff0000";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FILL_COLOR = "rgba(255, 0, 0, 0.5)";
export const DEFAULT_POINT_RADIUS = 5;
export const DEFAULT_POINT_COLOR = "#ff0000";

/**
 * Style of the feature when it is being created or edited.
 * This is used to give a visual feedback to the user that the feature is in an
 * intermediate state and not yet finalized.
 */
export const EDITING_STROKE_COLOR = "#0000ff";
export const EDITING_STROKE_WIDTH = 3;
export const EDITING_FILL_COLOR = "rgba(0, 0, 255, 0.5)";
export const EDITING_POINT_RADIUS = 7;
export const EDITING_POINT_COLOR = "#0000ff";

export function initializeStylePropertiesPolygonGeometry(
  feature: Feature<Polygon>,
) {
  feature.set(STYLE_KEY, {
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesLineStringGeometry(
  feature: Feature<LineString>,
) {
  feature.set(STYLE_KEY, {
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
  });
}

export function initializeStylePropertiesCircleGeometry(
  feature: Feature<Circle>,
) {
  feature.set(STYLE_KEY, {
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesPointGeometry(
  feature: Feature<Point>,
) {
  // inspo: https://openlayers.org/en/latest/examples/kml-earthquakes.html
  feature.set(STYLE_KEY, {
    [POINT_RADIUS_KEY]: DEFAULT_POINT_RADIUS,
    [POINT_COLOR_KEY]: DEFAULT_POINT_COLOR,
    // TODO: deal with icon and text
  });
}

/**
 * Adds the necessary properties to the feature to store the style information, with default values.
 */
export function initializeStyleProperties(feature: Feature<Geometry>) {
  switch (feature.getGeometry().getType()) {
    case "Point":
      initializeStylePropertiesPointGeometry(feature as Feature<Point>);
      break;
    case "LineString":
      initializeStylePropertiesLineStringGeometry(
        feature as Feature<LineString>,
      );
      break;
    case "Polygon":
      initializeStylePropertiesPolygonGeometry(feature as Feature<Polygon>);
      break;
    case "Circle":
      initializeStylePropertiesCircleGeometry(feature as Feature<Circle>);
      break;
  }
}
