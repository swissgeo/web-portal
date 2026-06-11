import type { Feature } from "ol";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";

import { MultiPoint } from "ol/geom";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

/**
 * names of the properties used to store the style information in the feature's properties
 */
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
export const DEFAULT_FILL_COLOR = "rgba(255, 0, 0, 0.3)";
export const DEFAULT_POINT_RADIUS = 5;
export const DEFAULT_POINT_COLOR = "#ff0000";

/**
 * Style of the feature when it is being created or edited.
 * This is used to give a visual feedback to the user that the feature is in an
 * intermediate state and not yet finalized.
 */
export const EDITING_STROKE_COLOR = "#0000ff";
export const EDITING_STROKE_WIDTH = 3;
export const EDITING_FILL_COLOR = "rgba(0, 0, 255, 0.3)";
export const EDITING_POINT_RADIUS = 5;
export const EDITING_POINT_COLOR = "#0000ff";
export const EDITING_VERTEX_COLOR = "#d735ff";
export const EDITING_VERTEX_RADIUS = 5;

export const SELECTED_STROKE_WIDTH = 5;

const EDITING_POLYGON_STYLE = [
  // The first style is for the stroke and fill of the polygon
  new Style({
    stroke: new Stroke({
      color: EDITING_STROKE_COLOR,
      width: EDITING_STROKE_WIDTH,
    }),
    fill: new Fill({
      color: EDITING_FILL_COLOR,
    }),
  }),

  // The second style (on top) extracts the vertices of the external ring,
  // convert them into a multi-point to render them as circles
  new Style({
    image: new CircleStyle({
      radius: EDITING_VERTEX_RADIUS,
      fill: new Fill({
        color: EDITING_VERTEX_COLOR,
      }),
    }),

    // return the coordinates of the first ring of the polygon as a multi point geometry, to render the vertices as circles
    geometry: function (feature) {
      const coordinates = (
        feature.getGeometry() as Polygon
      ).getCoordinates()[0];
      return new MultiPoint(coordinates);
    },
  }),
];

const SELECTED_POLYGON_STYLE = (feature: Feature<Polygon>) => {
  const props = feature.getProperties();
  return [
    new Style({
      stroke: new Stroke({
        color: "#FFFFFF",
        width: SELECTED_STROKE_WIDTH + 4,
      }),
    }),

    new Style({
      fill: new Fill({
        color: props[FILL_COLOR_KEY],
      }),
      stroke: new Stroke({
        color: props[STROKE_COLOR_KEY],
        width: SELECTED_STROKE_WIDTH,
      }),
    }),
  ];
};

/**
 * The style function for polygons in non-editing mode.
 * This style is driven by the properties of the feature,
 * which are initialized with default values when the feature is created, and can be modified by the user.
 */
const IDLE_POLYGON_STYLE = (feature: Feature<Polygon>) => {
  const props = feature.getProperties();
  return new Style({
    fill: new Fill({
      color: props[FILL_COLOR_KEY],
    }),
    stroke: new Stroke({
      color: props[STROKE_COLOR_KEY],
      width: props[STROKE_WIDTH_KEY],
    }),
  });
};

export function initializeStylePropertiesPolygonGeometry(
  feature: Feature<Polygon>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesLineStringGeometry(
  feature: Feature<LineString>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
  });
}

export function initializeStylePropertiesCircleGeometry(
  feature: Feature<Circle>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesPointGeometry(
  feature: Feature<Point>,
) {
  // inspo: https://openlayers.org/en/latest/examples/kml-earthquakes.html
  feature.setProperties({
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

/**
 * Apply the creating/editing style to a feature
 */
export function applyEditingStyle(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (geometry.getType()) {
    case "Polygon":
      feature.setStyle(EDITING_POLYGON_STYLE);
      break;
  }
}

export function applyIdleStyle(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (geometry.getType()) {
    case "Polygon":
      feature.setStyle(IDLE_POLYGON_STYLE(feature as Feature<Polygon>));
      break;
  }
}

export function applySelectedStyle(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (geometry.getType()) {
    case "Polygon":
      feature.setStyle(SELECTED_POLYGON_STYLE(feature as Feature<Polygon>));
      break;
  }
}
