import type { Geometry } from "ol/geom";
import type { StyleFunction } from "ol/style/Style";

import Feature from "ol/Feature";
import { Circle, LineString, Point, Polygon } from "ol/geom";
import { Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILL_COLOR,
  DEFAULT_HEX_FILL_ALPHA,
  DEFAULT_POINT_COLOR,
  DEFAULT_POINT_RADIUS,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  FILL_COLOR_KEY,
  getFeatureFillColorStyleProperty,
  getFeaturePointColorStyleProperty,
  getFeaturePointRadiusStyleProperty,
  getFeatureStrokeColorStyleProperty,
  getFeatureStrokeWidthStyleProperty,
  getStylePropertiesAsObject,
  initializeStyleProperties,
  POINT_COLOR_KEY,
  POINT_RADIUS_KEY,
  SELECTED_OUTLINE_COLOR,
  SELECTED_OUTLINE_WIDTH,
  setFeatureFillColorStyleProperty,
  setFeaturePointColorStyleProperty,
  setFeaturePointRadiusStyleProperty,
  setFeatureStrokeColorStyleProperty,
  setFeatureStrokeWidthStyleProperty,
  STROKE_COLOR_KEY,
  STROKE_WIDTH_KEY,
  applyIdleStyle,
  applySelectedStyle,
} from "@/utils/drawingStyle";

function makeFeature(geometry: Geometry) {
  return new Feature<Geometry>(geometry);
}

function getSingleStyle(feature: Feature<Geometry>) {
  const styleFunction = feature.getStyle() as StyleFunction;
  const style = styleFunction(feature, 1);

  expect(style).toBeInstanceOf(Style);
  return style as Style;
}

function getStyleArray(feature: Feature<Geometry>) {
  const styleFunction = feature.getStyle() as StyleFunction;
  const style = styleFunction(feature, 1);

  expect(Array.isArray(style)).toBe(true);
  return style as Style[];
}

describe("initializeStyleProperties", () => {
  it("sets point defaults only for point geometries", () => {
    const feature = makeFeature(new Point([0, 0]));

    initializeStyleProperties(feature);

    expect(getStylePropertiesAsObject(feature)).toEqual({
      [FILL_COLOR_KEY]: undefined,
      [STROKE_COLOR_KEY]: undefined,
      [STROKE_WIDTH_KEY]: undefined,
      [POINT_RADIUS_KEY]: DEFAULT_POINT_RADIUS,
      [POINT_COLOR_KEY]: DEFAULT_POINT_COLOR,
    });
  });

  it("sets stroke defaults only for line geometries", () => {
    const feature = makeFeature(
      new LineString([
        [0, 0],
        [1, 1],
      ]),
    );

    initializeStyleProperties(feature);

    expect(getStylePropertiesAsObject(feature)).toEqual({
      [FILL_COLOR_KEY]: undefined,
      [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
      [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
      [POINT_RADIUS_KEY]: undefined,
      [POINT_COLOR_KEY]: undefined,
    });
  });

  it("sets fill and stroke defaults for polygon geometries", () => {
    const feature = makeFeature(
      new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ]),
    );

    initializeStyleProperties(feature);

    expect(getStylePropertiesAsObject(feature)).toEqual({
      [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
      [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
      [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
      [POINT_RADIUS_KEY]: undefined,
      [POINT_COLOR_KEY]: undefined,
    });
  });

  it("sets fill and stroke defaults for circle geometries", () => {
    const feature = makeFeature(new Circle([0, 0], 10));

    initializeStyleProperties(feature);

    expect(getStylePropertiesAsObject(feature)).toEqual({
      [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
      [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
      [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
      [POINT_RADIUS_KEY]: undefined,
      [POINT_COLOR_KEY]: undefined,
    });
  });
});

describe("style property helpers", () => {
  it("sets and reads style properties with typed getters", () => {
    const feature = makeFeature(new Point([0, 0]));

    setFeatureFillColorStyleProperty(feature, "#112233");
    setFeatureStrokeColorStyleProperty(feature, "#445566");
    setFeatureStrokeWidthStyleProperty(feature, 5);
    setFeaturePointRadiusStyleProperty(feature, 9);
    setFeaturePointColorStyleProperty(feature, "#778899");

    expect(getFeatureFillColorStyleProperty(feature)).toBe("#112233");
    expect(getFeatureStrokeColorStyleProperty(feature)).toBe("#445566");
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBe(5);
    expect(getFeaturePointRadiusStyleProperty(feature)).toBe(9);
    expect(getFeaturePointColorStyleProperty(feature)).toBe("#778899");
  });

  it("returns null when a style property is missing or has the wrong type", () => {
    const feature = makeFeature(new Point([0, 0]));

    feature.set(STROKE_WIDTH_KEY, "wide");
    feature.set(POINT_COLOR_KEY, 12);

    expect(getFeatureFillColorStyleProperty(feature)).toBeNull();
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBeNull();
    expect(getFeaturePointColorStyleProperty(feature)).toBeNull();
  });
});

describe("feature style functions", () => {
  it("applies idle point styles from feature properties", () => {
    const feature = makeFeature(new Point([0, 0]));
    setFeaturePointRadiusStyleProperty(feature, 8);
    setFeaturePointColorStyleProperty(feature, "#abcdef");

    applyIdleStyle(feature);

    const style = getSingleStyle(feature);
    const image = style.getImage();

    expect(image).toBeInstanceOf(CircleStyle);
    expect((image as CircleStyle).getRadius()).toBe(8);
    expect((image as CircleStyle).getFill()?.getColor()).toBe("#abcdef");
  });

  it("applies idle polygon styles from feature properties", () => {
    const feature = makeFeature(
      new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ]),
    );

    setFeatureFillColorStyleProperty(feature, "#123456");
    setFeatureStrokeColorStyleProperty(feature, "#654321");
    setFeatureStrokeWidthStyleProperty(feature, 6);

    applyIdleStyle(feature);

    const style = getSingleStyle(feature);

    expect(style.getFill()?.getColor()).toBe(
      `#123456${DEFAULT_HEX_FILL_ALPHA}`,
    );
    expect(style.getStroke()?.getColor()).toBe("#654321");
    expect(style.getStroke()?.getWidth()).toBe(6);
  });

  it("adds selected outlines around point styles", () => {
    const feature = makeFeature(new Point([0, 0]));
    setFeaturePointRadiusStyleProperty(feature, 8);
    setFeaturePointColorStyleProperty(feature, "#abcdef");

    applySelectedStyle(feature);

    const [style] = getStyleArray(feature);
    const image = style.getImage();

    expect(image).toBeInstanceOf(CircleStyle);
    expect((image as CircleStyle).getRadius()).toBe(
      8 + SELECTED_OUTLINE_WIDTH / 2,
    );
    expect((image as CircleStyle).getFill()?.getColor()).toBe("#abcdef");
    expect((image as CircleStyle).getStroke()?.getColor()).toBe(
      SELECTED_OUTLINE_COLOR,
    );
    expect((image as CircleStyle).getStroke()?.getWidth()).toBe(
      SELECTED_OUTLINE_WIDTH,
    );
  });

  it("adds selected outlines around polygon styles", () => {
    const feature = makeFeature(
      new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ]),
    );

    setFeatureFillColorStyleProperty(feature, "#123456");
    setFeatureStrokeColorStyleProperty(feature, "#654321");
    setFeatureStrokeWidthStyleProperty(feature, 6);

    applySelectedStyle(feature);

    const [outlineStyle, innerStyle] = getStyleArray(feature);

    expect(outlineStyle.getStroke()?.getColor()).toBe(SELECTED_OUTLINE_COLOR);
    expect(outlineStyle.getStroke()?.getWidth()).toBe(
      6 + SELECTED_OUTLINE_WIDTH * 2,
    );
    expect(innerStyle.getFill()?.getColor()).toBe(
      `#123456${DEFAULT_HEX_FILL_ALPHA}`,
    );
    expect(innerStyle.getStroke()?.getColor()).toBe("#654321");
    expect(innerStyle.getStroke()?.getWidth()).toBe(6);
  });
});
