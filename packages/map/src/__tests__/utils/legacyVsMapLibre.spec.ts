import type { Style } from "ol/style";

import { Feature } from "ol";
import { stylefunction } from "ol-mapbox-style";
import { asArray } from "ol/color";
import { LineString, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { describe, it, expect } from "vitest";

import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import { geoadminToMapLibreStyle } from "@/utils/geoadminToMapLibreStyle";
import OlStyleForPropertyValue from "@/utils/geoJsonStyleFromLiterals";
import { makeGetImage } from "@/utils/maplibreShapeIcons";

/**
 * Tier-2 fidelity check: the legacy `OlStyleForPropertyValue` is the trusted oracle
 * (it's the implementation we're replacing). For representative features we compare
 * the OpenLayers styles it produces against the styles produced by converting to a
 * MapLibre style and rendering it through `ol-mapbox-style`. The directly-comparable
 * visual properties (colors, widths, radius) must match.
 *
 * Intentional, whitelisted differences:
 * - Non-circle point shapes: legacy uses an OL RegularShape; the new path uses a
 *   generated icon (symbol layer). Representation differs by design, so we only
 *   assert both produce an image, not pixel equality.
 * - Polygons: legacy emits one Style with fill+stroke; the new path emits a fill
 *   layer + a separate line layer. We aggregate the new styles before comparing.
 */

/** Normalize any OL color (hex / rgba / named / array) to a rounded [r,g,b,a]. */
function norm(color: unknown): number[] | undefined {
  if (color === undefined || color === null) {
    return undefined;
  }
  const [r, g, b, a] = asArray(color as string | number[]);
  return [r, g, b, Math.round((a ?? 1) * 100) / 100];
}

interface Visual {
  fill?: number[];
  stroke?: number[];
  strokeWidth?: number;
  radius?: number;
  imgFill?: number[];
  imgStroke?: number[];
  imgStrokeWidth?: number;
  imageKind?: string;
  text?: string;
}

/** Aggregate one or more OL styles into a single comparable visual descriptor. */
function visual(styles: Style[]): Visual {
  const d: Visual = {};
  for (const style of styles) {
    const fill = style.getFill?.();
    if (fill && d.fill === undefined) {
      d.fill = norm(fill.getColor());
    }
    const stroke = style.getStroke?.();
    if (stroke) {
      if (d.stroke === undefined) {
        d.stroke = norm(stroke.getColor());
      }
      if (d.strokeWidth === undefined) {
        d.strokeWidth = stroke.getWidth();
      }
    }
    const image = style.getImage?.();
    if (image) {
      d.imageKind = image.constructor.name;
      const asCircle = image as { getRadius?: () => number };
      if (typeof asCircle.getRadius === "function") {
        d.radius = asCircle.getRadius();
      }
      const withFill = image as { getFill?: () => { getColor: () => unknown } };
      if (typeof withFill.getFill === "function" && withFill.getFill()) {
        d.imgFill = norm(withFill.getFill()!.getColor());
      }
      const withStroke = image as {
        getStroke?: () => { getColor: () => unknown; getWidth: () => number };
      };
      if (typeof withStroke.getStroke === "function" && withStroke.getStroke()) {
        d.imgStroke = norm(withStroke.getStroke()!.getColor());
        d.imgStrokeWidth = withStroke.getStroke()!.getWidth();
      }
    }
    const text = style.getText?.();
    if (text && text.getText?.()) {
      d.text = text.getText() as string;
    }
  }
  return d;
}

function legacyStyles(
  def: GeoAdminGeoJSONStyleDefinition,
  feature: Feature,
  resolution = 1,
): Style[] {
  const styled = new OlStyleForPropertyValue(def).getFeatureStyle(
    feature,
    resolution,
  );
  return styled ? [styled] : [];
}

function mapLibreStyles(
  def: GeoAdminGeoJSONStyleDefinition,
  feature: Feature,
  resolution = 1,
): Style[] {
  const { style, icons } = geoadminToMapLibreStyle(def, "s");
  const layer = new VectorLayer({ source: new VectorSource({ features: [feature] }) });
  stylefunction(
    layer,
    style,
    "s",
    undefined,
    undefined,
    undefined,
    undefined,
    makeGetImage(icons),
  );
  const fn = layer.getStyleFunction()!;
  const result = fn(feature, resolution);
  if (!result) {
    return [];
  }
  return Array.isArray(result) ? (result as Style[]) : [result as Style];
}

describe("legacy vs MapLibre — circle point (unique)", () => {
  const def = {
    type: "unique",
    property: "c",
    values: [
      {
        geomType: "point",
        value: 1,
        vectorOptions: {
          type: "circle",
          radius: 8,
          fill: { color: "#808080" },
          stroke: { color: "#ffffff", width: 2 },
        },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const feature = new Feature({ geometry: new Point([0, 0]), c: 1 });

  it("produces equivalent radius, fill and stroke", () => {
    const legacy = visual(legacyStyles(def, feature));
    const mapLibre = visual(mapLibreStyles(def, feature));
    expect(mapLibre.radius).toBe(legacy.radius);
    expect(mapLibre.imgFill).toEqual(legacy.imgFill);
    expect(mapLibre.imgStroke).toEqual(legacy.imgStroke);
    expect(mapLibre.imgStrokeWidth).toBe(legacy.imgStrokeWidth);
  });
});

describe("legacy vs MapLibre — circle point (range)", () => {
  const def = {
    type: "range",
    property: "v",
    ranges: [
      {
        geomType: "point",
        range: [0, 10],
        vectorOptions: {
          type: "circle",
          radius: 5,
          fill: { color: "#00ff00" },
          stroke: { color: "#000000", width: 1 },
        },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const feature = new Feature({ geometry: new Point([0, 0]), v: 5 });

  it("matches the entry whose range contains the value", () => {
    const legacy = visual(legacyStyles(def, feature));
    const mapLibre = visual(mapLibreStyles(def, feature));
    expect(legacy.radius).toBe(5); // sanity: legacy actually matched
    expect(mapLibre.radius).toBe(legacy.radius);
    expect(mapLibre.imgFill).toEqual(legacy.imgFill);
  });
});

describe("legacy vs MapLibre — line", () => {
  const def = {
    type: "single",
    property: "n/a",
    geomType: "line",
    vectorOptions: {
      type: "square",
      fill: { color: "#000000" },
      stroke: { color: "#0000ff", width: 3 },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const feature = new Feature({
    geometry: new LineString([
      [0, 0],
      [1, 1],
    ]),
  });

  it("produces an equivalent stroke", () => {
    const legacy = visual(legacyStyles(def, feature));
    const mapLibre = visual(mapLibreStyles(def, feature));
    expect(mapLibre.stroke).toEqual(legacy.stroke);
    expect(mapLibre.strokeWidth).toBe(legacy.strokeWidth);
  });
});

describe("legacy vs MapLibre — polygon (fill + outline)", () => {
  const def = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: {
      type: "square",
      fill: { color: "#ff0000" },
      stroke: { color: "#333333", width: 2 },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const feature = new Feature({
    geometry: new Polygon([
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [0, 0],
      ],
    ]),
  });

  it("matches fill and outline once the new path's layers are aggregated", () => {
    const legacy = visual(legacyStyles(def, feature));
    // The new path splits a polygon into a fill layer + a line (outline) layer.
    // ol-mapbox-style also gives the fill layer an incidental stroke matching the
    // fill, so we assert the grey outline stroke is *among* the produced strokes.
    const styles = mapLibreStyles(def, feature);
    expect(visual(styles).fill).toEqual(legacy.fill);

    const strokes = styles
      .map((s) => s.getStroke?.())
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ color: norm(s.getColor()), width: s.getWidth() }));
    expect(strokes).toContainEqual({
      color: legacy.stroke,
      width: legacy.strokeWidth,
    });
  });
});

describe("legacy vs MapLibre — non-circle shape (intentional difference)", () => {
  const def = {
    type: "unique",
    property: "c",
    values: [
      {
        geomType: "point",
        value: 1,
        vectorOptions: {
          type: "triangle",
          radius: 10,
          fill: { color: "#808080" },
          stroke: { color: "#ffffff", width: 1 },
        },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const feature = new Feature({ geometry: new Point([0, 0]), c: 1 });

  it("legacy uses a RegularShape; the new path emits a generated icon spec", () => {
    const legacy = visual(legacyStyles(def, feature));
    expect(legacy.imageKind).toBe("RegularShape");
    // The converter routes non-circle shapes to a symbol layer + generated icon.
    const { style, icons } = geoadminToMapLibreStyle(def, "s");
    expect(icons).toHaveLength(1);
    expect(icons[0]!.shape).toBe("triangle");
    expect(style.layers[0]!.type).toBe("symbol");
  });
});
