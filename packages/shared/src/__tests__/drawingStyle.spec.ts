import type { FeatureLike } from "ol/Feature";

import { Circle as CircleStyle, Fill } from "ol/style";
import Style from "ol/style/Style";
import { describe, expect, it } from "vitest";

import type { TextAnchor } from "../drawingStyle";

import {
  bearingBetweenCoordinates,
  createDrawingFeatureStyleFunction,
  DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS,
  DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS,
  DRAWING_KML_LAYER_ID,
  formatDistanceKilometers,
  isDrawingFeature,
  MAX_MEASUREMENT_RADIUS_INTERVALS,
  normalizeDrawingStyleProps,
  parseBoolean,
  parseDashPattern,
  parseNumeric,
  resolveColoredSvgDataUrl,
  resolveDrawingFeatureKind,
  resolvePointLabelAnchor,
  resolveStyleProps,
  safeParseStyleObject,
  STYLE_PROPERTY_KEYS,
  toMeasurementLabelStyle,
  toRgbaColor,
} from "../drawingStyle";

describe("constants", () => {
  it("DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS is 10", () => {
    expect(DEFAULT_MEASUREMENT_INTERVAL_KILOMETERS).toBe(10);
  });

  it("DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS is 100", () => {
    expect(DEFAULT_MEASUREMENT_PATH_INTERVAL_KILOMETERS).toBe(100);
  });

  it("MAX_MEASUREMENT_RADIUS_INTERVALS is 40", () => {
    expect(MAX_MEASUREMENT_RADIUS_INTERVALS).toBe(40);
  });

  it("DRAWING_KML_LAYER_ID is user-drawing-layer-kml", () => {
    expect(DRAWING_KML_LAYER_ID).toBe("user-drawing-layer-kml");
  });

  it("STYLE_PROPERTY_KEYS contains all expected keys", () => {
    expect(STYLE_PROPERTY_KEYS).toEqual([
      "iconId",
      "iconColor",
      "iconSize",
      "textColor",
      "textSize",
      "textAnchor",
      "strokeColor",
      "strokeWidth",
      "strokeOpacity",
      "dashPattern",
      "fillColor",
      "fillOpacity",
      "intervalKilometers",
      "labelColor",
      "labelSize",
    ]);
  });
});

describe("toRgbaColor", () => {
  it("converts short hex to rgba", () => {
    expect(toRgbaColor("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("converts long hex to rgba", () => {
    expect(toRgbaColor("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
  });

  it("converts mixed case hex", () => {
    expect(toRgbaColor("#aAbBcC", 0.8)).toBe("rgba(170, 187, 204, 0.8)");
  });

  it("clamps opacity below 0", () => {
    expect(toRgbaColor("#000", -1)).toBe("rgba(0, 0, 0, 0)");
  });

  it("clamps opacity above 1", () => {
    expect(toRgbaColor("#000", 5)).toBe("rgba(0, 0, 0, 1)");
  });

  it("returns non-hex color as-is", () => {
    expect(toRgbaColor("red", 0.5)).toBe("red");
    expect(toRgbaColor("rgb(0,0,0)", 0.5)).toBe("rgb(0,0,0)");
  });
});

describe("formatDistanceKilometers", () => {
  it("formats meters to km with 2 decimal places", () => {
    expect(formatDistanceKilometers(1500)).toBe("1.50 km");
  });

  it("formats zero meters", () => {
    expect(formatDistanceKilometers(0)).toBe("0.00 km");
  });

  it("formats large distances", () => {
    expect(formatDistanceKilometers(123456)).toBe("123.46 km");
  });
});

describe("bearingBetweenCoordinates", () => {
  it("returns 0 for same point", () => {
    expect(bearingBetweenCoordinates([0, 0], [0, 0])).toBe(0);
  });

  it("returns 0 for due north", () => {
    expect(bearingBetweenCoordinates([0, 0], [0, 10])).toBe(0);
  });

  it("returns 90 for due east", () => {
    expect(bearingBetweenCoordinates([0, 0], [10, 0])).toBe(90);
  });

  it("returns 180 for due south", () => {
    expect(bearingBetweenCoordinates([0, 0], [0, -10])).toBe(180);
  });

  it("returns 270 for due west", () => {
    expect(bearingBetweenCoordinates([0, 0], [-10, 0])).toBe(270);
  });

  it("returns null for non-number coordinates", () => {
    expect(
      bearingBetweenCoordinates([undefined as unknown as number, 0], [0, 0]),
    ).toBeNull();
    expect(
      bearingBetweenCoordinates([0, undefined as unknown as number], [0, 0]),
    ).toBeNull();
  });
});

describe("parseBoolean", () => {
  it("returns boolean as-is", () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean(false)).toBe(false);
  });

  it("parses 1 as true, 0 as false", () => {
    expect(parseBoolean(1)).toBe(true);
    expect(parseBoolean(0)).toBe(false);
  });

  it('parses "true", "yes", "1" as true', () => {
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("TRUE")).toBe(true);
    expect(parseBoolean("yes")).toBe(true);
    expect(parseBoolean("1")).toBe(true);
  });

  it('parses "false", "no", "0" as false', () => {
    expect(parseBoolean("false")).toBe(false);
    expect(parseBoolean("no")).toBe(false);
    expect(parseBoolean("0")).toBe(false);
  });

  it("returns false for other types", () => {
    expect(parseBoolean(null)).toBe(false);
    expect(parseBoolean(undefined)).toBe(false);
    expect(parseBoolean("random")).toBe(false);
    expect(parseBoolean(42)).toBe(false);
  });
});

describe("parseNumeric", () => {
  it("returns finite number as-is", () => {
    expect(parseNumeric(42)).toBe(42);
    expect(parseNumeric(0)).toBe(0);
    expect(parseNumeric(-3.14)).toBe(-3.14);
  });

  it("returns undefined for Infinity and NaN numbers", () => {
    expect(parseNumeric(Number.NaN)).toBeUndefined();
    expect(parseNumeric(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(parseNumeric(Number.NEGATIVE_INFINITY)).toBeUndefined();
  });

  it("parses numeric strings", () => {
    expect(parseNumeric("42")).toBe(42);
    expect(parseNumeric(" 7.5 ")).toBe(7.5);
    expect(parseNumeric("-10")).toBe(-10);
  });

  it("returns undefined for empty string", () => {
    expect(parseNumeric("")).toBeUndefined();
    expect(parseNumeric("   ")).toBeUndefined();
  });

  it("returns undefined for non-numeric strings", () => {
    expect(parseNumeric("abc")).toBeUndefined();
  });

  it("returns undefined for non-number, non-string types", () => {
    expect(parseNumeric(null)).toBeUndefined();
    expect(parseNumeric(undefined)).toBeUndefined();
    expect(parseNumeric(true)).toBeUndefined();
  });
});

describe("parseDashPattern", () => {
  it("parses array of numbers", () => {
    expect(parseDashPattern([10, 5, 2, 5])).toEqual([10, 5, 2, 5]);
  });

  it("filters non-numeric entries from array", () => {
    expect(parseDashPattern([10, "abc", 5])).toEqual([10, 5]);
  });

  it("returns undefined for empty array", () => {
    expect(parseDashPattern([])).toBeUndefined();
  });

  it("parses comma-separated string", () => {
    expect(parseDashPattern("10, 5, 2")).toEqual([10, 5, 2]);
  });

  it("parses JSON array string", () => {
    expect(parseDashPattern("[10, 5, 2]")).toEqual([10, 5, 2]);
  });

  it("returns undefined for invalid JSON string that looks like an array", () => {
    expect(parseDashPattern("[10, {invalid}]")).toBeUndefined();
  });

  it("returns undefined for empty or whitespace string", () => {
    expect(parseDashPattern("")).toBeUndefined();
    expect(parseDashPattern("   ")).toBeUndefined();
  });

  it("returns undefined for non-array, non-string types", () => {
    expect(parseDashPattern(42)).toBeUndefined();
    expect(parseDashPattern(null)).toBeUndefined();
  });

  it("returns undefined when all entries are non-numeric", () => {
    expect(parseDashPattern("abc, def")).toBeUndefined();
  });
});

describe("safeParseStyleObject", () => {
  it("returns object as-is", () => {
    const obj = { a: 1 };
    expect(safeParseStyleObject(obj)).toBe(obj);
  });

  it("parses JSON string to object", () => {
    expect(safeParseStyleObject('{"a": 1}')).toEqual({ a: 1 });
  });

  it("returns empty object for invalid JSON", () => {
    expect(safeParseStyleObject("{invalid}")).toEqual({});
  });

  it("returns empty object for non-object JSON", () => {
    expect(safeParseStyleObject('"just a string"')).toEqual({});
    expect(safeParseStyleObject("42")).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(safeParseStyleObject("")).toEqual({});
  });

  it("returns empty object for non-string, non-object types", () => {
    expect(safeParseStyleObject(null)).toEqual({});
    expect(safeParseStyleObject(42)).toEqual({});
  });
});

describe("normalizeDrawingStyleProps", () => {
  it("parses numeric string values to numbers", () => {
    const result = normalizeDrawingStyleProps({
      iconSize: "2",
      textSize: "16",
      strokeWidth: "3",
      strokeOpacity: "0.5",
      fillOpacity: "0.2",
      intervalKilometers: "10",
      labelSize: "12",
    });
    expect(result.iconSize).toBe(2);
    expect(result.textSize).toBe(16);
    expect(result.strokeWidth).toBe(3);
    expect(result.strokeOpacity).toBe(0.5);
    expect(result.fillOpacity).toBe(0.2);
    expect(result.intervalKilometers).toBe(10);
    expect(result.labelSize).toBe(12);
  });

  it("parses dashPattern from string", () => {
    const result = normalizeDrawingStyleProps({
      dashPattern: "10, 5",
    });
    expect(result.dashPattern).toEqual([10, 5]);
  });

  it("leaves non-numeric keys untouched", () => {
    const result = normalizeDrawingStyleProps({
      iconId: "my-icon",
      textColor: "#ff0000",
    });
    expect(result.iconId).toBe("my-icon");
    expect(result.textColor).toBe("#ff0000");
  });

  it("does not mutate the input", () => {
    const input = { strokeWidth: "3" };
    normalizeDrawingStyleProps(input);
    expect(input.strokeWidth).toBe("3");
  });
});

function mockFeature(
  properties: Record<string, unknown> = {},
  geometryType?: string,
  coordinates?: unknown,
): FeatureLike {
  const geometry = geometryType
    ? {
        getType: () => geometryType,
        getCoordinates: () => coordinates ?? [],
      }
    : undefined;
  return {
    get: (key: string) => properties[key],
    getGeometry: () => geometry,
  } as unknown as FeatureLike;
}

describe("toMeasurementLabelStyle", () => {
  it("returns a TextStyle with the given text", () => {
    const style = toMeasurementLabelStyle("10.00 km");
    expect(style.getText()).toBe("10.00 km");
  });

  it("uses default fill and background colors", () => {
    const style = toMeasurementLabelStyle("test");
    expect(style.getFill()?.getColor()).toBe("#ffffff");
    expect(style.getBackgroundFill()?.getColor()).toBe("#dc2626");
  });

  it("uses custom colors", () => {
    const style = toMeasurementLabelStyle("test", "#0000ff", "#ffff00");
    expect(style.getBackgroundFill()?.getColor()).toBe("#0000ff");
    expect(style.getFill()?.getColor()).toBe("#ffff00");
  });

  it("centers text", () => {
    const style = toMeasurementLabelStyle("test");
    expect(style.getTextAlign()).toBe("center");
    expect(style.getTextBaseline()).toBe("middle");
  });
});

describe("resolvePointLabelAnchor", () => {
  it.each([
    ["top-left", { textAlign: "right", offsetX: -14, offsetY: -30 }],
    ["top-center", { textAlign: "center", offsetX: 0, offsetY: -30 }],
    ["top-right", { textAlign: "left", offsetX: 14, offsetY: -30 }],
    ["center-left", { textAlign: "right", offsetX: -14, offsetY: 0 }],
    ["center", { textAlign: "center", offsetX: 0, offsetY: 0 }],
    ["center-right", { textAlign: "left", offsetX: 14, offsetY: 0 }],
    ["bottom-left", { textAlign: "right", offsetX: -14, offsetY: 30 }],
    ["bottom-center", { textAlign: "center", offsetX: 0, offsetY: 30 }],
    ["bottom-right", { textAlign: "left", offsetX: 14, offsetY: 30 }],
  ])("returns correct offsets for %s", (anchor, expected) => {
    expect(resolvePointLabelAnchor(anchor as TextAnchor)).toEqual(expected);
  });

  it("returns center defaults for undefined", () => {
    expect(resolvePointLabelAnchor(undefined)).toEqual({
      textAlign: "center",
      offsetX: 0,
      offsetY: 0,
    });
  });
});

describe("isDrawingFeature", () => {
  it("returns true when kind is set", () => {
    const feature = mockFeature({ kind: "Point" });
    expect(isDrawingFeature(feature)).toBe(true);
  });

  it("returns true when drawingStyle is set", () => {
    const feature = mockFeature({ drawingStyle: "{}" });
    expect(isDrawingFeature(feature)).toBe(true);
  });

  it("returns true when isTextFeature is set", () => {
    const feature = mockFeature({ isTextFeature: true });
    expect(isDrawingFeature(feature)).toBe(true);
  });

  it("returns false when none are set", () => {
    expect(isDrawingFeature(mockFeature({}))).toBe(false);
  });
});

describe("resolveStyleProps", () => {
  it("merges drawingStyle, style, and direct properties", () => {
    const feature = mockFeature({
      drawingStyle: '{"strokeWidth": 5}',
      style: '{"fillColor": "#000"}',
      iconId: "my-icon",
    });
    const result = resolveStyleProps(feature);
    expect(result.strokeWidth).toBe(5);
    expect(result.fillColor).toBe("#000");
    expect(result.iconId).toBe("my-icon");
  });

  it("direct properties override drawingStyle", () => {
    const feature = mockFeature({
      drawingStyle: '{"strokeWidth": 5}',
      strokeWidth: 10,
    });
    const result = resolveStyleProps(feature);
    expect(result.strokeWidth).toBe(10);
  });

  it("normalizes numeric string values", () => {
    const feature = mockFeature({
      drawingStyle: '{"strokeWidth": "3"}',
    });
    const result = resolveStyleProps(feature);
    expect(result.strokeWidth).toBe(3);
  });

  it("ignores empty/null/undefined direct properties", () => {
    const feature = mockFeature({
      strokeWidth: "",
      fillColor: null,
      iconId: undefined,
    });
    const result = resolveStyleProps(feature);
    expect(result.strokeWidth).toBeUndefined();
    expect(result.fillColor).toBeUndefined();
    expect(result.iconId).toBeUndefined();
  });
});

describe("resolveDrawingFeatureKind", () => {
  it("resolves kind from feature metadata", () => {
    expect(resolveDrawingFeatureKind(mockFeature({ kind: "Point" }))).toBe(
      "Point",
    );
    expect(resolveDrawingFeatureKind(mockFeature({ kind: "Text" }))).toBe(
      "Text",
    );
    expect(
      resolveDrawingFeatureKind(mockFeature({ kind: "MeasurementRadius" })),
    ).toBe("MeasurementRadius");
    expect(
      resolveDrawingFeatureKind(mockFeature({ kind: "MeasurementPath" })),
    ).toBe("MeasurementPath");
  });

  it("resolves kind from measurementSubtype", () => {
    expect(
      resolveDrawingFeatureKind(mockFeature({ measurementSubtype: "radius" })),
    ).toBe("MeasurementRadius");
    expect(
      resolveDrawingFeatureKind(mockFeature({ measurementSubtype: "path" })),
    ).toBe("MeasurementPath");
  });

  it("resolves kind from geometry type fallback", () => {
    expect(resolveDrawingFeatureKind(mockFeature({}, "Point"), {})).toBe(
      "Point",
    );
    expect(resolveDrawingFeatureKind(mockFeature({}, "LineString"), {})).toBe(
      "LineString",
    );
    expect(resolveDrawingFeatureKind(mockFeature({}, "Polygon"), {})).toBe(
      "Polygon",
    );
  });

  it("resolves Text from isTextFeature flag", () => {
    expect(
      resolveDrawingFeatureKind(
        mockFeature({ isTextFeature: "true" }, "Point"),
      ),
    ).toBe("Text");
  });

  it("resolves MeasurementRadius from LineString with interval", () => {
    const feature = mockFeature({ intervalKilometers: 10 }, "LineString", [
      [0, 0],
      [10, 0],
    ]);
    expect(resolveDrawingFeatureKind(feature)).toBe("MeasurementRadius");
  });

  it("resolves MeasurementPath from LineString with 3+ coordinates and interval", () => {
    const feature = mockFeature({ intervalKilometers: 10 }, "LineString", [
      [0, 0],
      [100000, 0],
      [200000, 0],
    ]);
    expect(resolveDrawingFeatureKind(feature)).toBe("MeasurementPath");
  });

  it("returns Unknown for unrecognized geometry", () => {
    expect(resolveDrawingFeatureKind(mockFeature({}, "Circle"))).toBe(
      "Unknown",
    );
  });
});

describe("resolveColoredSvgDataUrl", () => {
  it("returns source when no color provided", () => {
    const svg = "data:image/svg+xml;base64,abc";
    expect(resolveColoredSvgDataUrl(svg)).toBe(svg);
  });

  it("returns source when not a data URI", () => {
    expect(
      resolveColoredSvgDataUrl("https://example.com/icon.svg", "#ff0000"),
    ).toBe("https://example.com/icon.svg");
  });

  it("recolors fill and stroke in SVG", () => {
    const svgContent = '<svg><path fill="#123456" stroke="#abcdef"/></svg>';
    const encoded = btoa(svgContent);
    const dataUrl = `data:image/svg+xml;base64,${encoded}`;

    const result = resolveColoredSvgDataUrl(dataUrl, "#ff0000");
    const decoded = atob(result.replace("data:image/svg+xml;base64,", ""));

    expect(decoded).toContain('fill="#ff0000"');
    expect(decoded).toContain('stroke="#ff0000"');
  });

  it("preserves white fills and strokes", () => {
    const svgContent = '<svg><path fill="#fff" stroke="#ffffff"/></svg>';
    const encoded = btoa(svgContent);
    const dataUrl = `data:image/svg+xml;base64,${encoded}`;

    const result = resolveColoredSvgDataUrl(dataUrl, "#ff0000");
    const decoded = atob(result.replace("data:image/svg+xml;base64,", ""));

    expect(decoded).toContain('fill="#fff"');
    expect(decoded).toContain('stroke="#ffffff"');
  });
});

describe("createDrawingFeatureStyleFunction", () => {
  const styleFn = createDrawingFeatureStyleFunction(undefined);

  function toStyles(result: Style | Style[] | void): Style[] {
    if (!result) {
      return [];
    }
    return Array.isArray(result) ? result : [result];
  }

  it("returns a style for unknown geometry kind", () => {
    const feature = mockFeature({ kind: "Unknown" }, "Circle");
    const result = styleFn(feature, 0);
    expect(result).toBeDefined();
  });

  describe("Text kind", () => {
    it("returns text style for feature with text", () => {
      const feature = mockFeature({ kind: "Text", text: "Hello" }, "Point");
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      const textStyles = styles.filter(
        (s) => s instanceof Style && s.getText(),
      );
      expect(textStyles.length).toBeGreaterThanOrEqual(1);
      expect(textStyles[0].getText()?.getText()).toBe("Hello");
    });

    it("returns invisible point style for empty text", () => {
      const feature = mockFeature({ kind: "Text", text: "" }, "Point");
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBe(1);
      const image = styles[0].getImage();
      expect(image).toBeDefined();
    });

    it("adds description style when isDescriptionVisible", () => {
      const feature = mockFeature(
        {
          kind: "Text",
          text: "Title",
          description: "Desc",
          isDescriptionVisible: "true",
        },
        "Point",
      );
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBe(2);
    });
  });

  describe("Point kind", () => {
    it("returns circle style for point without icon", () => {
      const feature = mockFeature({ kind: "Point" }, "Point");
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(1);
      expect(styles[0].getImage()).toBeDefined();
    });

    it("adds selection ring when isSelected", () => {
      const feature = mockFeature(
        { kind: "Point", __isSelected: "true" },
        "Point",
      );
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(2);
    });

    it("adds title label when title is present", () => {
      const feature = mockFeature(
        { kind: "Point", title: "My Point" },
        "Point",
      );
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      const textStyles = styles.filter(
        (s) => s instanceof Style && s.getText(),
      );
      expect(textStyles.length).toBeGreaterThanOrEqual(1);
      expect(textStyles[0].getText()?.getText()).toBe("My Point");
    });
  });

  describe("LineString kind", () => {
    it("returns stroke style", () => {
      const feature = mockFeature({ kind: "LineString" }, "LineString", [
        [0, 0],
        [10, 10],
      ]);
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(1);
      expect(styles[0].getStroke()).toBeDefined();
    });

    it("adds selection vertices when isSelected", () => {
      const feature = mockFeature(
        { kind: "LineString", __isSelected: "true" },
        "LineString",
        [
          [0, 0],
          [10, 10],
          [20, 0],
        ],
      );
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Polygon kind", () => {
    it("returns fill and stroke style", () => {
      const feature = mockFeature({ kind: "Polygon" }, "Polygon", [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]);
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(1);
      expect(styles[0].getFill()).toBeDefined();
      expect(styles[0].getStroke()).toBeDefined();
    });
  });

  describe("MeasurementRadius", () => {
    it("returns circle and label styles", () => {
      const feature = mockFeature(
        {
          kind: "MeasurementRadius",
          intervalKilometers: 10,
        },
        "LineString",
        [
          [2600000, 1200000],
          [2601000, 1200000],
        ],
      );
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("MeasurementPath", () => {
    it("returns stroke and label styles", () => {
      const feature = mockFeature({ kind: "MeasurementPath" }, "LineString", [
        [0, 0],
        [100000, 0],
      ]);
      const result = styleFn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("baseStyleLike", () => {
    it("merges base styles for Point kind", () => {
      const baseStyle = new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: "#000" }),
        }),
      });
      const fn = createDrawingFeatureStyleFunction(baseStyle);
      const feature = mockFeature({ kind: "Point" }, "Point");
      const result = fn(feature, 0);
      const styles = toStyles(result);
      expect(styles.length).toBeGreaterThanOrEqual(1);
    });

    it("accepts baseStyleLike as a function", () => {
      const baseFn = () =>
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: "#000" }),
          }),
        });
      const fn = createDrawingFeatureStyleFunction(baseFn);
      const feature = mockFeature({ kind: "Point" }, "Point");
      const result = fn(feature, 0);
      expect(result).toBeDefined();
    });

    it("accepts baseStyleLike as an array", () => {
      const baseStyles = [
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: "#000" }),
          }),
        }),
      ];
      const fn = createDrawingFeatureStyleFunction(baseStyles);
      const feature = mockFeature({ kind: "Point" }, "Point");
      const result = fn(feature, 0);
      expect(result).toBeDefined();
    });
  });
});
