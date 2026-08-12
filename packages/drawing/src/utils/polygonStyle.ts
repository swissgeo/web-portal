import type { FeatureLike } from "ol/Feature";
import type { Polygon } from "ol/geom";
import type { StyleFunction } from "ol/style/Style";

import { MultiPoint } from "ol/geom";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

import {
  DEFAULT_HEX_FILL_ALPHA,
  EDITING_FILL_COLOR,
  EDITING_OUTLINE_COLOR,
  EDITING_OUTLINE_WIDTH,
  EDITING_POINT_COLOR,
  EDITING_POINT_RADIUS,
  EDITING_STROKE_COLOR,
  EDITING_STROKE_WIDTH,
  SELECTED_OUTLINE_WIDTH,
  SELECTED_OUTLINE_COLOR,
  STROKE_WIDTH_KEY,
  FILL_COLOR_KEY,
  STROKE_COLOR_KEY,
} from "./drawingStyleCommon";

export const POLYGON_EDITING_STYLE: StyleFunction = (_feature: FeatureLike) => {
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
        const coordinates = (
          feature.getGeometry() as Polygon
        ).getCoordinates()[0];
        return new MultiPoint(coordinates);
      },
    }),
  ];
};

export const POLYGON_SELECTED_STYLE = (feature: FeatureLike) => {
  const props = feature.getProperties();

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
export const POLYGON_IDLE_STYLE: StyleFunction = (feature: FeatureLike) => {
  const props = feature.getProperties();

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
