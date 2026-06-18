import type { Feature } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";
import type { StyleFunction } from "ol/style/Style";

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
 * The style as exchanged between the drawing composable and the UI for editing the style of a feature.
 */
export type FeatureStyle = {
  [FILL_COLOR_KEY]?: string;
  [STROKE_COLOR_KEY]?: string;
  [STROKE_WIDTH_KEY]?: number;
  [POINT_RADIUS_KEY]?: number;
  [POINT_COLOR_KEY]?: string;
};

export const DEFAULT_HEX_FILL_ALPHA = "4d";

/**
 * Default values for the style properties.
 * Note: these are not for the style "as creating/editing" but for the initial style of a feature when it is created.
 */
export const DEFAULT_STROKE_COLOR = "#ff0000";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FILL_COLOR = "#ff0000";
export const DEFAULT_POINT_RADIUS = 4;
export const DEFAULT_POINT_COLOR = "#ff0000";

/**
 * Style of the feature when it is being created or edited.
 * This is used to give a visual feedback to the user that the feature is in an
 * intermediate state and not yet finalized.
 */
export const EDITING_STROKE_COLOR = "#ff8800";
export const EDITING_STROKE_WIDTH = 2;
export const EDITING_FILL_COLOR = "#ffaa00";
export const EDITING_OUTLINE_WIDTH = 2;
export const EDITING_POINT_COLOR = "#ff8800";
export const EDITING_POINT_RADIUS =
  1 + DEFAULT_POINT_RADIUS + EDITING_OUTLINE_WIDTH / 2;
export const EDITING_OUTLINE_COLOR = "#FFFFFF";

export const SELECTED_OUTLINE_WIDTH = 2;
export const SELECTED_POINT_RADIUS =
  1 + DEFAULT_POINT_RADIUS + SELECTED_OUTLINE_WIDTH / 2;
export const SELECTED_OUTLINE_COLOR = "#FFFFFF";

const EDITING_STYLE: StyleFunction = (_feature: FeatureLike) => {
  return [
    // Outline of the edges
    new Style({
      stroke: new Stroke({
        color: EDITING_OUTLINE_COLOR,
        width: EDITING_STROKE_WIDTH + EDITING_OUTLINE_WIDTH * 2,
      }),
    }),

    // actual edges
    new Style({
      stroke: new Stroke({
        color: EDITING_STROKE_COLOR,
        width: EDITING_STROKE_WIDTH,
      }),
      fill: new Fill({
        color: `${EDITING_FILL_COLOR}${DEFAULT_HEX_FILL_ALPHA}`,
      }),
    }),

    // Vertices showing as small circles with an outline
    new Style({
      image: new CircleStyle({
        radius: EDITING_POINT_RADIUS,
        fill: new Fill({
          color: EDITING_POINT_COLOR,
        }),
        stroke: new Stroke({
          color: EDITING_OUTLINE_COLOR,
          width: EDITING_OUTLINE_WIDTH,
        }),
      }),

      // return the coordinates of the first ring of the polygon as a multi point geometry, to render the vertices as circles
      geometry: function (feature) {
        const type = feature.getGeometry()?.getType();

        switch (type) {
          case "Polygon": {
            const coordinates = (
              feature.getGeometry() as Polygon
            ).getCoordinates()[0];
            return new MultiPoint(coordinates);
          }
          case "LineString": {
            const lineCoordinates = (
              feature.getGeometry() as LineString
            ).getCoordinates();
            return new MultiPoint(lineCoordinates);
          }
          case "Circle": {
            const circleCoordinates = (
              feature.getGeometry() as Circle
            ).getCenter();
            return new MultiPoint([circleCoordinates]);
          }
          case "Point":
            return feature.getGeometry();
          default:
            return null;
        }
      },
    }),
  ];
};

const SELECTED_STYLE = (feature: FeatureLike) => {
  const props = feature.getProperties();

  if (feature.getGeometry()?.getType() === "Point") {
    return [
      new Style({
        image: new CircleStyle({
          // Only half of the outline width is added to the radius because
          // the outline is drawn on both sides of the circle's edge.
          radius: props[POINT_RADIUS_KEY] + SELECTED_OUTLINE_WIDTH / 2,
          fill: new Fill({
            color: props[POINT_COLOR_KEY],
          }),
          stroke: new Stroke({
            color: SELECTED_OUTLINE_COLOR,
            width: SELECTED_OUTLINE_WIDTH,
          }),
        }),
      }),
    ];
  }

  return [
    new Style({
      stroke: new Stroke({
        color: SELECTED_OUTLINE_COLOR,
        width: props[STROKE_WIDTH_KEY] + SELECTED_OUTLINE_WIDTH * 2,
      }),
    }),

    new Style({
      fill: new Fill({
        color: `${props[FILL_COLOR_KEY]}${DEFAULT_HEX_FILL_ALPHA}`,
      }),
      stroke: new Stroke({
        color: props[STROKE_COLOR_KEY],
        width: props[STROKE_WIDTH_KEY],
      }),
    }),
  ];
};

/**
 * The style function for polygons in non-editing mode.
 * This style is driven by the properties of the feature,
 * which are initialized with default values when the feature is created, and can be modified by the user.
 */
const IDLE_STYLE: StyleFunction = (feature: FeatureLike) => {
  const props = feature.getProperties();

  if (feature.getGeometry()?.getType() === "Point") {
    return new Style({
      image: new CircleStyle({
        radius: props[POINT_RADIUS_KEY],
        fill: new Fill({
          color: props[POINT_COLOR_KEY],
        }),
      }),
    });
  }

  return new Style({
    fill: new Fill({
      color: `${props[FILL_COLOR_KEY]}${DEFAULT_HEX_FILL_ALPHA}`,
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

  feature.setStyle(EDITING_STYLE);
}

export function applyIdleStyle(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  feature.setStyle(IDLE_STYLE);
}

export function applySelectedStyle(feature: Feature<Geometry>) {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  feature.setStyle(SELECTED_STYLE);
}

/**
 * From a given feature, extract the style-related properties and return them as an object.
 * Note: depending on the type of geometry, some properties may be undefined, as they are not relevant for that type of geometry.
 */
export function getStylePropertiesAsObject(
  feature: Feature<Geometry>,
): FeatureStyle {
  return {
    [FILL_COLOR_KEY]: feature.get(FILL_COLOR_KEY),
    [STROKE_COLOR_KEY]: feature.get(STROKE_COLOR_KEY),
    [STROKE_WIDTH_KEY]: feature.get(STROKE_WIDTH_KEY),
    [POINT_RADIUS_KEY]: feature.get(POINT_RADIUS_KEY),
    [POINT_COLOR_KEY]: feature.get(POINT_COLOR_KEY),
  };
}

function setFeatureStyleProperty(
  feature: Feature<Geometry>,
  key: string,
  value: string | number,
) {
  if (!feature) {
    return;
  }
  feature.set(key, value);
}

function getFeatureStyleProperty(
  feature: Feature<Geometry>,
  key: string,
): null | string | number {
  if (!feature) {
    return null;
  }
  return feature.get(key) ?? null;
}

export function setFeatureFillColorStyleProperty(
  feature: Feature<Geometry>,
  color: string,
) {
  setFeatureStyleProperty(feature, FILL_COLOR_KEY, color);
}

export function getFeatureFillColorStyleProperty(
  feature: Feature<Geometry>,
): string | null {
  const color = getFeatureStyleProperty(feature, FILL_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setFeatureStrokeColorStyleProperty(
  feature: Feature<Geometry>,
  color: string,
) {
  setFeatureStyleProperty(feature, STROKE_COLOR_KEY, color);
}

export function getFeatureStrokeColorStyleProperty(
  feature: Feature<Geometry>,
): string | null {
  const color = getFeatureStyleProperty(feature, STROKE_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setFeatureStrokeWidthStyleProperty(
  feature: Feature<Geometry>,
  width: number,
) {
  setFeatureStyleProperty(feature, STROKE_WIDTH_KEY, width);
}

export function getFeatureStrokeWidthStyleProperty(
  feature: Feature<Geometry>,
): number | null {
  const width = getFeatureStyleProperty(feature, STROKE_WIDTH_KEY);
  return typeof width === "number" ? width : null;
}

export function setFeaturePointRadiusStyleProperty(
  feature: Feature<Geometry>,
  radius: number,
) {
  setFeatureStyleProperty(feature, POINT_RADIUS_KEY, radius);
}

export function getFeaturePointRadiusStyleProperty(
  feature: Feature<Geometry>,
): number | null {
  const radius = getFeatureStyleProperty(feature, POINT_RADIUS_KEY);
  return typeof radius === "number" ? radius : null;
}

export function setFeaturePointColorStyleProperty(
  feature: Feature<Geometry>,
  color: string,
) {
  setFeatureStyleProperty(feature, POINT_COLOR_KEY, color);
}

export function getFeaturePointColorStyleProperty(
  feature: Feature<Geometry>,
): string | null {
  const color = getFeatureStyleProperty(feature, POINT_COLOR_KEY);
  return typeof color === "string" ? color : null;
}
