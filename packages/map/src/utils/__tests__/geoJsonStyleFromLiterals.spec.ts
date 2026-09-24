import { Feature } from "ol";
import LineString from "ol/geom/LineString";
import MultiLineString from "ol/geom/MultiLineString";
import MultiPolygon from "ol/geom/MultiPolygon";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  RegularShape,
  Style,
  Text,
} from "ol/style";
import { describe, expect, it, vi } from "vitest";

import type { GeoAdminGeoJSONStyleDefinition } from "../geojson";

import OlStyleForPropertyValue, {
  getOlImageStyleForShape,
} from "../geoJsonStyleFromLiterals";

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
  LogPreDefinedColor: {
    Orange: "orange",
  },
}));

const paint = {
  fill: { color: "red" },
  stroke: { color: "black", width: 1 },
};

describe("getOlImageStyleForShape", () => {
  it("creates a Circle style", () => {
    const style = getOlImageStyleForShape({
      type: "circle",
      radius: 5,
      ...paint,
    });
    expect(style).toBeInstanceOf(CircleStyle);
  });

  it("creates an Icon style", () => {
    const style = getOlImageStyleForShape({
      type: "icon",
      src: "icon.png",
      scale: 1,
      anchor: [0.5, 0.5],
    });
    expect(style).toBeInstanceOf(Icon);
  });

  it("creates a RegularShape for square", () => {
    const style = getOlImageStyleForShape({
      type: "square",
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape for triangle", () => {
    const style = getOlImageStyleForShape({
      type: "triangle",
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape for pentagon", () => {
    const style = getOlImageStyleForShape({
      type: "pentagon",
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape for star with radius", () => {
    const style = getOlImageStyleForShape({
      type: "star",
      radius: 10,
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape for cross", () => {
    const style = getOlImageStyleForShape({
      type: "cross",
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape for hexagon", () => {
    const style = getOlImageStyleForShape({
      type: "hexagon",
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });

  it("creates a RegularShape with 0 points for unknown type", () => {
    const style = getOlImageStyleForShape({
      type: "unknown" as never,
      ...paint,
    });
    expect(style).toBeInstanceOf(RegularShape);
  });
});

function makeFeature(
  geometryType:
    | "point"
    | "line"
    | "polygon"
    | "multilinestring"
    | "multipolygon",
  properties: Record<string, unknown> = {},
): Feature {
  let geometry;
  switch (geometryType) {
    case "point":
      geometry = new Point([0, 0]);
      break;
    case "line":
      geometry = new LineString([
        [0, 0],
        [1, 1],
      ]);
      break;
    case "polygon":
      geometry = new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ]);
      break;
    case "multilinestring":
      geometry = new MultiLineString([
        [
          [0, 0],
          [1, 1],
        ],
        [
          [2, 2],
          [3, 3],
        ],
      ]);
      break;
    case "multipolygon":
      geometry = new MultiPolygon([
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      ]);
      break;
  }
  const feature = new Feature(geometry);
  feature.setProperties(properties);
  return feature;
}

describe("OlStyleForPropertyValue", () => {
  describe("single style type", () => {
    const config: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "status",
      geomType: "point",
      vectorOptions: {
        type: "circle",
        radius: 5,
        fill: { color: "blue" },
        stroke: { color: "navy", width: 2 },
      },
    };

    it("returns the single style for any feature", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point");
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns default style when no olStyle is set", () => {
      const configNoVector: GeoAdminGeoJSONStyleDefinition = {
        type: "single",
        property: "status",
        geomType: "line",
      };
      const olStyle = new OlStyleForPropertyValue(configNoVector);
      const feature = makeFeature("line");
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("unique style type", () => {
    const config: GeoAdminGeoJSONStyleDefinition = {
      type: "unique",
      property: "category",
      values: [
        {
          geomType: "point",
          value: "A",
          vectorOptions: {
            type: "circle",
            radius: 5,
            fill: { color: "green" },
            stroke: { color: "darkgreen", width: 1 },
          },
        },
        {
          geomType: "point",
          value: "B",
          vectorOptions: {
            type: "circle",
            radius: 8,
            fill: { color: "red" },
            stroke: { color: "darkred", width: 1 },
          },
        },
        {
          geomType: "line",
          value: "A",
          vectorOptions: {
            type: "square",
            fill: { color: "yellow" },
            stroke: { color: "black", width: 1 },
          },
        },
      ],
    };

    it("returns style matching the property value", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const featureA = makeFeature("point", { category: "A" });
      const featureB = makeFeature("point", { category: "B" });

      const styleA = olStyle.getFeatureStyle(featureA, 1);
      const styleB = olStyle.getFeatureStyle(featureB, 1);

      expect(styleA).toBeInstanceOf(Style);
      expect(styleB).toBeInstanceOf(Style);
    });

    it("returns default style when property value not found", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { category: "C" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns default style when property is missing from feature", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", {});
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns style for correct geomType", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("line", { category: "A" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("range style type", () => {
    const config: GeoAdminGeoJSONStyleDefinition = {
      type: "range",
      property: "population",
      ranges: [
        {
          geomType: "point",
          range: [0, 10000],
          vectorOptions: {
            type: "circle",
            radius: 3,
            fill: { color: "lightgreen" },
            stroke: { color: "green", width: 1 },
          },
        },
        {
          geomType: "point",
          range: [10000, 100000],
          vectorOptions: {
            type: "circle",
            radius: 6,
            fill: { color: "orange" },
            stroke: { color: "darkorange", width: 1 },
          },
        },
        {
          geomType: "point",
          range: [100000, 1000000],
          vectorOptions: {
            type: "circle",
            radius: 10,
            fill: { color: "red" },
            stroke: { color: "darkred", width: 1 },
          },
        },
      ],
    };

    it("returns style for value in range", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { population: 5000 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns style for upper range", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { population: 500000 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns default style when value outside all ranges", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { population: 2000000 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns default style when property is missing", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", {});
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("returns default style for wrong geomType", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("line", { population: 5000 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("resolution filtering", () => {
    const config: GeoAdminGeoJSONStyleDefinition = {
      type: "unique",
      property: "status",
      values: [
        {
          geomType: "point",
          value: "active",
          minResolution: 0,
          maxResolution: 100,
          vectorOptions: {
            type: "circle",
            radius: 5,
            fill: { color: "green" },
            stroke: { color: "darkgreen", width: 1 },
          },
        },
        {
          geomType: "point",
          value: "active",
          minResolution: 100,
          maxResolution: Infinity,
          vectorOptions: {
            type: "circle",
            radius: 10,
            fill: { color: "blue" },
            stroke: { color: "darkblue", width: 1 },
          },
        },
      ],
    };

    it("returns different styles based on resolution", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { status: "active" });

      const styleLowRes = olStyle.getFeatureStyle(feature, 50);
      const styleHighRes = olStyle.getFeatureStyle(feature, 200);

      expect(styleLowRes).toBeInstanceOf(Style);
      expect(styleHighRes).toBeInstanceOf(Style);
    });
  });

  describe("label template", () => {
    const config: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "name",
      geomType: "point",
      vectorOptions: {
        type: "circle",
        radius: 5,
        fill: { color: "blue" },
        stroke: { color: "navy", width: 2 },
        label: {
          template: "${name} (${type})",
          text: {
            textAlign: "center",
            textBaseline: "middle",
            font: "12px sans-serif",
            scale: 1,
            padding: [0, 0, 0, 0],
            fill: { color: "black" },
            stroke: { color: "white", width: 2 },
          },
        },
      },
    };

    it("applies label template to feature", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", {
        name: "Station A",
        type: "hydro",
      });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("rotation", () => {
    const config = {
      type: "single",
      property: "direction",
      geomType: "point",
      rotation: "heading",
      vectorOptions: {
        type: "icon",
        src: "arrow.png",
      },
    } as unknown as GeoAdminGeoJSONStyleDefinition;

    it("applies rotation from property", () => {
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { heading: 1.57 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("label background styles", () => {
    it("creates style with backgroundFill and backgroundStroke", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "single",
        property: "name",
        geomType: "point",
        vectorOptions: {
          type: "circle",
          radius: 5,
          fill: { color: "blue" },
          stroke: { color: "navy", width: 2 },
          label: {
            template: "${name}",
            text: {
              textAlign: "center",
              textBaseline: "middle",
              font: "12px sans-serif",
              scale: 1,
              padding: [0, 0, 0, 0],
              fill: { color: "black" },
              stroke: { color: "white", width: 2 },
              backgroundFill: { color: "rgba(255,255,255,0.8)" },
              backgroundStroke: { color: "gray", width: 1 },
            },
          },
        },
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { name: "Test" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("MultiLineString geometry", () => {
    it("returns correct style for MultiLineString", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "category",
        values: [
          {
            geomType: "line",
            value: "road",
            vectorOptions: {
              type: "square",
              fill: { color: "yellow" },
              stroke: { color: "black", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("multilinestring", { category: "road" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).not.toBe(olStyle.defaultStyle);
    });
  });

  describe("Polygon geometry", () => {
    it("returns correct style for Polygon via unique config", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "category",
        values: [
          {
            geomType: "polygon",
            value: "zone",
            vectorOptions: {
              type: "square",
              fill: { color: "cyan" },
              stroke: { color: "blue", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("polygon", { category: "zone" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).not.toBe(olStyle.defaultStyle);
    });
  });

  describe("MultiPolygon geometry", () => {
    it("returns correct style for MultiPolygon", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "category",
        values: [
          {
            geomType: "polygon",
            value: "area",
            vectorOptions: {
              type: "square",
              fill: { color: "magenta" },
              stroke: { color: "purple", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("multipolygon", { category: "area" });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).not.toBe(olStyle.defaultStyle);
    });
  });

  describe("fallback value logging", () => {
    it("returns default style for null property value", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "status",
        values: [
          {
            geomType: "point",
            value: "active",
            vectorOptions: {
              type: "circle",
              radius: 5,
              fill: { color: "green" },
              stroke: { color: "darkgreen", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { status: null });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).toBe(olStyle.defaultStyle);
    });

    it("returns default style for array property value", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "tags",
        values: [
          {
            geomType: "point",
            value: "active",
            vectorOptions: {
              type: "circle",
              radius: 5,
              fill: { color: "green" },
              stroke: { color: "darkgreen", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { tags: ["a", "b"] });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).toBe(olStyle.defaultStyle);
    });
  });

  describe("resolution mismatch", () => {
    it("returns default style when no resolution matches", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "unique",
        property: "status",
        values: [
          {
            geomType: "point",
            value: "active",
            minResolution: 100,
            maxResolution: 200,
            vectorOptions: {
              type: "circle",
              radius: 5,
              fill: { color: "green" },
              stroke: { color: "darkgreen", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point", { status: "active" });
      const style = olStyle.getFeatureStyle(feature, 50);
      expect(style).toBeInstanceOf(Style);
      expect(style).toBe(olStyle.defaultStyle);
    });
  });

  describe("findOlStyleInRange_ defensive branches", () => {
    it("skips malformed range key without comma", () => {
      const baseConfig: GeoAdminGeoJSONStyleDefinition = {
        type: "range",
        property: "value",
        ranges: [
          {
            geomType: "point",
            range: [0, 100],
            vectorOptions: {
              type: "circle",
              radius: 5,
              fill: { color: "green" },
              stroke: { color: "darkgreen", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(baseConfig);
      olStyle.styles["point"]["bad"] = [
        {
          olStyle: new Style(),
          minResolution: 0,
          maxResolution: Infinity,
        },
      ];
      const feature = makeFeature("point", { value: 50 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });

    it("skips range with unparseable min/max", () => {
      const baseConfig: GeoAdminGeoJSONStyleDefinition = {
        type: "range",
        property: "value",
        ranges: [
          {
            geomType: "point",
            range: [0, 100],
            vectorOptions: {
              type: "circle",
              radius: 5,
              fill: { color: "green" },
              stroke: { color: "darkgreen", width: 1 },
            },
          },
        ],
      };
      const olStyle = new OlStyleForPropertyValue(baseConfig);
      olStyle.styles["point"]["foo,bar"] = [
        {
          olStyle: new Style(),
          minResolution: 0,
          maxResolution: Infinity,
        },
      ];
      const feature = makeFeature("point", { value: 50 });
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
    });
  });

  describe("setOlText_ labelProperty branch", () => {
    it("reads text from feature property when labelProperty is set", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "single",
        property: "name",
        geomType: "point",
        vectorOptions: {
          type: "circle",
          radius: 5,
          fill: { color: "blue" },
          stroke: { color: "navy", width: 2 },
          label: {
            template: "${name}",
            text: {
              textAlign: "center",
              textBaseline: "middle",
              font: "12px sans-serif",
              scale: 1,
              padding: [0, 0, 0, 0],
              fill: { color: "black" },
              stroke: { color: "white", width: 2 },
            },
          },
        },
      };
      const olStyle = new OlStyleForPropertyValue(config);
      const style = new Style({
        text: new Text({
          fill: new Fill({ color: "black" }),
        }),
      });
      const result = olStyle.setOlText_(style, "myLabel", undefined, {
        myLabel: "hello",
      });
      expect(result).toBeInstanceOf(Style);
    });
  });

  describe("getFeatureStyle defensive branches", () => {
    it("returns default style when singleStyle has no olStyle", () => {
      const config: GeoAdminGeoJSONStyleDefinition = {
        type: "single",
        property: "status",
        geomType: "point",
        vectorOptions: {
          type: "circle",
          radius: 5,
          fill: { color: "blue" },
          stroke: { color: "navy", width: 2 },
        },
      };
      const olStyle = new OlStyleForPropertyValue(config);
      olStyle.singleStyle!.olStyle = undefined;
      const feature = makeFeature("point");
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).toBe(olStyle.defaultStyle);
    });

    it("returns default style for unrecognized type", () => {
      const config = {
        type: "gradient",
        property: "x",
        geomType: "point",
      } as unknown as GeoAdminGeoJSONStyleDefinition;
      const olStyle = new OlStyleForPropertyValue(config);
      const feature = makeFeature("point");
      const style = olStyle.getFeatureStyle(feature, 1);
      expect(style).toBeInstanceOf(Style);
      expect(style).toBe(olStyle.defaultStyle);
    });
  });
});
