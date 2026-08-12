import type { Geometry } from "ol/geom";
import type { Style } from "ol/style";
import type CircleStyle from "ol/style/Circle";
import type { StyleFunction } from "ol/style/Style";

import Feature from "ol/Feature";
import { Circle, LineString, MultiPoint, Point, Polygon } from "ol/geom";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { CIRCLE_EDITING_STYLE } from "@/utils/circleStyle";
import {
  applyEditingStyle,
  applyIdleStyle,
  applySelectedStyle,
  DEFAULT_HEX_FILL_ALPHA,
  EDITING_FILL_COLOR,
  EDITING_OUTLINE_COLOR,
  EDITING_OUTLINE_WIDTH,
  EDITING_POINT_COLOR,
  EDITING_POINT_RADIUS,
  EDITING_STROKE_COLOR,
  EDITING_STROKE_WIDTH,
  FILL_COLOR_KEY,
  initializeStyleProperties,
  SELECTED_OUTLINE_COLOR,
  SELECTED_OUTLINE_WIDTH,
  STROKE_COLOR_KEY,
  STROKE_WIDTH_KEY,
} from "@/utils/drawingStyleCommon";
import { LINESTRING_EDITING_STYLE } from "@/utils/lineStringStyle";
import { POINT_EDITING_STYLE } from "@/utils/pointStyle";
import { POLYGON_EDITING_STYLE } from "@/utils/polygonStyle";

function resolveStyles(
  styleFunction: StyleFunction,
  feature: Feature<Geometry>,
): Style[] {
  const resolved = styleFunction(feature, 1);
  return (Array.isArray(resolved) ? resolved : [resolved]) as Style[];
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("editing styles", () => {
  it.each([
    [
      "line string",
      new LineString([
        [0, 0],
        [2, 3],
      ]),
      LINESTRING_EDITING_STYLE,
      [
        [0, 0],
        [2, 3],
      ],
    ],
    [
      "polygon",
      new Polygon([
        [
          [0, 0],
          [2, 0],
          [2, 3],
          [0, 0],
        ],
      ]),
      POLYGON_EDITING_STYLE,
      [
        [0, 0],
        [2, 0],
        [2, 3],
        [0, 0],
      ],
    ],
    ["circle", new Circle([4, 5], 10), CIRCLE_EDITING_STYLE, [[4, 5]]],
  ] as const)(
    "renders outlined edges and vertices for a %s",
    (_name, geometry, styleFunction, expectedVertices) => {
      const feature = new Feature<Geometry>(geometry);
      const [outline, inner, vertices] = resolveStyles(styleFunction, feature);

      expect(outline.getStroke()?.getColor()).toBe(EDITING_OUTLINE_COLOR);
      expect(outline.getStroke()?.getWidth()).toBe(
        EDITING_STROKE_WIDTH + EDITING_OUTLINE_WIDTH * 2,
      );
      expect(inner.getStroke()?.getColor()).toBe(EDITING_STROKE_COLOR);
      expect(inner.getStroke()?.getWidth()).toBe(EDITING_STROKE_WIDTH);
      expect(inner.getFill()?.getColor()).toBe(
        `${EDITING_FILL_COLOR}${DEFAULT_HEX_FILL_ALPHA}`,
      );

      const vertexImage = vertices.getImage() as CircleStyle;
      expect(vertexImage.getRadius()).toBe(EDITING_POINT_RADIUS);
      expect(vertexImage.getFill()?.getColor()).toBe(EDITING_POINT_COLOR);
      expect(vertexImage.getStroke()?.getColor()).toBe(EDITING_OUTLINE_COLOR);
      expect(vertexImage.getStroke()?.getWidth()).toBe(EDITING_OUTLINE_WIDTH);
      const vertexGeometry = vertices.getGeometryFunction()(feature);
      expect(vertexGeometry).toBeInstanceOf(MultiPoint);
      expect((vertexGeometry as MultiPoint).getCoordinates()).toEqual(
        expectedVertices,
      );
    },
  );

  it("renders point creation feedback as an outlined circle", () => {
    const feature = new Feature<Geometry>(new Point([0, 0]));
    const [style] = resolveStyles(POINT_EDITING_STYLE, feature);
    const image = style.getImage() as CircleStyle;

    expect(image.getRadius()).toBe(EDITING_POINT_RADIUS);
    expect(image.getFill()?.getColor()).toBe(EDITING_POINT_COLOR);
    expect(image.getStroke()?.getColor()).toBe(EDITING_OUTLINE_COLOR);
    expect(image.getStroke()?.getWidth()).toBe(EDITING_OUTLINE_WIDTH);
  });
});

describe("idle and selected geometry styles", () => {
  it.each([
    [
      "line string",
      new LineString([
        [0, 0],
        [1, 1],
      ]),
    ],
    [
      "polygon",
      new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ]),
    ],
    ["circle", new Circle([0, 0], 4)],
  ] as const)("renders feature properties for a %s", (_name, geometry) => {
    const feature = new Feature<Geometry>(geometry);
    initializeStyleProperties(feature);
    feature.set(FILL_COLOR_KEY, "#123456");
    feature.set(STROKE_COLOR_KEY, "#654321");
    feature.set(STROKE_WIDTH_KEY, 5);

    applyIdleStyle(feature);
    const idleStyle = resolveStyles(
      feature.getStyle() as StyleFunction,
      feature,
    )[0];
    expect(idleStyle.getFill()?.getColor()).toBe(
      `#123456${DEFAULT_HEX_FILL_ALPHA}`,
    );
    expect(idleStyle.getStroke()?.getColor()).toBe("#654321");
    expect(idleStyle.getStroke()?.getWidth()).toBe(5);

    applySelectedStyle(feature);
    const [outline, selected] = resolveStyles(
      feature.getStyle() as StyleFunction,
      feature,
    );
    expect(outline.getStroke()?.getColor()).toBe(SELECTED_OUTLINE_COLOR);
    expect(outline.getStroke()?.getWidth()).toBe(
      5 + SELECTED_OUTLINE_WIDTH * 2,
    );
    expect(selected.getFill()?.getColor()).toBe(
      `#123456${DEFAULT_HEX_FILL_ALPHA}`,
    );
    expect(selected.getStroke()?.getColor()).toBe("#654321");
    expect(selected.getStroke()?.getWidth()).toBe(5);
  });

  it("dispatches the editing style for each supported geometry", () => {
    const features = [
      new Feature<Geometry>(new Point([0, 0])),
      new Feature<Geometry>(
        new LineString([
          [0, 0],
          [1, 1],
        ]),
      ),
      new Feature<Geometry>(
        new Polygon([
          [
            [0, 0],
            [1, 0],
            [0, 0],
          ],
        ]),
      ),
      new Feature<Geometry>(new Circle([0, 0], 2)),
    ];

    for (const feature of features) {
      applyEditingStyle(feature);
      expect(typeof feature.getStyle()).toBe("function");
    }
  });

  it("ignores missing features and geometries", () => {
    const featureWithoutGeometry = new Feature<Geometry>();

    expect(() => applyEditingStyle(null)).not.toThrow();
    expect(() => applyIdleStyle(featureWithoutGeometry)).not.toThrow();
    expect(() => applySelectedStyle(featureWithoutGeometry)).not.toThrow();
    expect(featureWithoutGeometry.getStyle()).toBeNull();
  });
});
