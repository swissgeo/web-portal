import type { Geometry } from "ol/geom";
import type { StyleFunction } from "ol/style/Style";

import Feature from "ol/Feature";
import { Circle, LineString, Point, Polygon } from "ol/geom";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { rgbaToHex } from "@/core/color";
import {
  DESCRIPTION_KEY,
  initializeMetadataProperties,
  TITLE_KEY,
} from "@/utils/drawingMetadata";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_HEX_FILL_ALPHA,
  DEFAULT_POINT_COLOR,
  DEFAULT_POINT_RADIUS,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  FILL_COLOR_KEY,
  ICON_ANCHOR_KEY,
  ICON_URL_KEY,
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
  SHOW_DESCRIPTION_KEY,
  SHOW_TITLE_KEY,
  setFeatureFillColorStyleProperty,
  setFeaturePointColorStyleProperty,
  setFeaturePointRadiusStyleProperty,
  setFeatureStrokeColorStyleProperty,
  setFeatureStrokeWidthStyleProperty,
  STROKE_COLOR_KEY,
  STROKE_WIDTH_KEY,
  TEXT_PLACEMENT_KEY,
  applyIdleStyle,
  applySelectedStyle,
  mapKmlStylesToFeatureProperties,
} from "@/utils/drawingStyleCommon";

beforeEach(() => {
  setActivePinia(createPinia());
});

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

function initializePoint(feature: Feature<Geometry>) {
  initializeStyleProperties(feature);
  initializeMetadataProperties(feature);
  feature.set(ICON_URL_KEY, "https://icons.test/marker.png");
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
  it("applies idle point icon styles from feature properties", () => {
    const feature = makeFeature(new Point([0, 0]));
    initializePoint(feature);

    applyIdleStyle(feature);

    const [style] = getStyleArray(feature);
    const image = style.getImage() as Icon;

    expect(image).toBeInstanceOf(Icon);
    expect(image.getSrc()).toBe("https://icons.test/marker.png");
    expect(
      (
        image as unknown as {
          initialOptions_: { height: number; width: number };
        }
      ).initialOptions_,
    ).toMatchObject({ height: 24, width: 24 });
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

  it("uses the same property-driven rendering for selected points", () => {
    const feature = makeFeature(new Point([0, 0]));
    initializePoint(feature);

    applySelectedStyle(feature);

    const [style] = getStyleArray(feature);
    const image = style.getImage() as Icon;

    expect(image).toBeInstanceOf(Icon);
    expect(image.getSrc()).toBe("https://icons.test/marker.png");
  });

  it.each([
    ["north", "center"],
    ["center", "center"],
    ["south", "center"],
    ["east", "left"],
    ["north-east", "left"],
    ["south-east", "left"],
    ["west", "right"],
    ["north-west", "right"],
    ["south-west", "right"],
  ] as const)(
    "aligns the title and description group for %s placement",
    (placement, expectedAlign) => {
      const feature = makeFeature(new Point([0, 0]));
      initializePoint(feature);
      feature.set(TITLE_KEY, "Title");
      feature.set(DESCRIPTION_KEY, "Description");
      feature.set(SHOW_TITLE_KEY, true);
      feature.set(SHOW_DESCRIPTION_KEY, true);
      feature.set(TEXT_PLACEMENT_KEY, placement);

      applySelectedStyle(feature);

      const [, titleStyle, descriptionStyle] = getStyleArray(feature);

      expect(titleStyle.getText()?.getTextAlign()).toBe(expectedAlign);
      expect(descriptionStyle.getText()?.getTextAlign()).toBe(expectedAlign);
    },
  );

  it("places the complete title and description group above the symbol", () => {
    const feature = makeFeature(new Point([0, 0]));
    initializePoint(feature);
    feature.set(TITLE_KEY, "Title");
    feature.set(DESCRIPTION_KEY, "Description");
    feature.set(SHOW_TITLE_KEY, true);
    feature.set(SHOW_DESCRIPTION_KEY, true);
    feature.set(TEXT_PLACEMENT_KEY, "north");

    applySelectedStyle(feature);

    const [, titleStyle, descriptionStyle] = getStyleArray(feature);
    const titleText = titleStyle.getText();
    const descriptionText = descriptionStyle.getText();

    expect(titleText?.getOffsetY()).toBeLessThan(0);
    expect(descriptionText?.getOffsetY()).toBe(
      (titleText?.getOffsetY() ?? 0) + 2,
    );
  });

  it("places south text closer to a bottom-anchored icon", () => {
    const getSouthOffset = (anchor: [number, number]) => {
      const feature = makeFeature(new Point([0, 0]));
      initializePoint(feature);
      feature.set(TITLE_KEY, "Title");
      feature.set(SHOW_TITLE_KEY, true);
      feature.set(TEXT_PLACEMENT_KEY, "south");
      feature.set(ICON_ANCHOR_KEY, anchor);

      applySelectedStyle(feature);

      const [, titleStyle] = getStyleArray(feature);
      return titleStyle.getText()?.getOffsetY();
    };

    expect(getSouthOffset([0.5, 1])).toBeLessThan(
      getSouthOffset([0.5, 0.5]) ?? 0,
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

describe("rgbaToHex", () => {
  it("converts opaque red", () => {
    expect(rgbaToHex([255, 0, 0, 1])).toBe("#ff0000");
  });

  it("converts opaque blue", () => {
    expect(rgbaToHex([0, 0, 255, 1])).toBe("#0000ff");
  });

  it("converts semi-transparent green", () => {
    expect(rgbaToHex([0, 128, 0, 0.5])).toBe("#008000");
  });

  it("converts black", () => {
    expect(rgbaToHex([0, 0, 0, 1])).toBe("#000000");
  });

  it("converts white", () => {
    expect(rgbaToHex([255, 255, 255, 1])).toBe("#ffffff");
  });
});

describe("mapKmlStylesToFeatureProperties", () => {
  it("maps polygon fill and stroke from OL styles", () => {
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
    feature.setStyle(
      new Style({
        fill: new Fill({ color: [0, 128, 255, 0.6] }),
        stroke: new Stroke({ color: [255, 0, 0, 1], width: 3 }),
      }),
    );

    mapKmlStylesToFeatureProperties(feature);

    expect(getFeatureFillColorStyleProperty(feature)).toBe("#0080ff");
    expect(getFeatureStrokeColorStyleProperty(feature)).toBe("#ff0000");
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBe(3);
  });

  it("maps linestring stroke from OL styles", () => {
    const feature = makeFeature(
      new LineString([
        [0, 0],
        [1, 1],
      ]),
    );
    feature.setStyle(
      new Style({
        stroke: new Stroke({ color: [0, 255, 0, 1], width: 5 }),
      }),
    );

    mapKmlStylesToFeatureProperties(feature);

    expect(getFeatureStrokeColorStyleProperty(feature)).toBe("#00ff00");
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBe(5);
  });

  it("preserves initialized defaults when no OL style is set", () => {
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

    mapKmlStylesToFeatureProperties(feature);

    expect(getFeatureFillColorStyleProperty(feature)).toBe(DEFAULT_FILL_COLOR);
    expect(getFeatureStrokeColorStyleProperty(feature)).toBe(
      DEFAULT_STROKE_COLOR,
    );
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBe(
      DEFAULT_STROKE_WIDTH,
    );
  });

  it("falls back to defaults when OL style has no fill or stroke (nameStyle wrapping)", () => {
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
    // Simulate OL's nameStyle which only has text, no fill/stroke
    initializeStyleProperties(feature);
    feature.setStyle(new Style({ text: undefined }));

    mapKmlStylesToFeatureProperties(feature);

    expect(getFeatureFillColorStyleProperty(feature)).toBe(DEFAULT_FILL_COLOR);
    expect(getFeatureStrokeColorStyleProperty(feature)).toBe(
      DEFAULT_STROKE_COLOR,
    );
    expect(getFeatureStrokeWidthStyleProperty(feature)).toBe(
      DEFAULT_STROKE_WIDTH,
    );
  });

  it("preserves initialized point defaults when no OL style is set", () => {
    const feature = makeFeature(new Point([0, 0]));
    initializeStyleProperties(feature);

    mapKmlStylesToFeatureProperties(feature);

    expect(getFeaturePointColorStyleProperty(feature)).toBe(
      DEFAULT_POINT_COLOR,
    );
    expect(getFeaturePointRadiusStyleProperty(feature)).toBe(
      DEFAULT_POINT_RADIUS,
    );
  });

  it("clears OL-parsed style after mapping", () => {
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
    feature.setStyle(
      new Style({
        fill: new Fill({ color: [0, 128, 255, 0.6] }),
        stroke: new Stroke({ color: [255, 0, 0, 1], width: 3 }),
      }),
    );

    mapKmlStylesToFeatureProperties(feature);

    expect(feature.getStyle()).toBeUndefined();
  });
});
