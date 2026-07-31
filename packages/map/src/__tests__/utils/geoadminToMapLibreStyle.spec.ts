import { describe, it, expect, vi } from "vitest";

vi.mock("@swissgeo/log", () => ({
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: new Proxy({}, { get: (_t, p) => String(p) }),
}));

import log from "@swissgeo/log";

import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import {
  geoadminToMapLibreStyle,
  labelTemplateToExpression,
  parseCssFont,
} from "@/utils/geoadminToMapLibreStyle";
import { makeGetImage } from "@/utils/maplibreShapeIcons";

// The real geoadmin style for ch.bafu.hydroweb-messstationen_grundwasser. `rotation`
// is present in real data but absent from the exported type, so we cast the literal.
const HYDROWEB_UNIQUE = {
  type: "unique",
  property: "grundwasser-class",
  values: [
    {
      geomType: "point",
      value: 2,
      vectorOptions: {
        type: "circle",
        radius: 8,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
    {
      geomType: "point",
      value: 1,
      vectorOptions: {
        type: "triangle",
        radius: 12,
        rotation: 1.0471975511965976,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
    {
      geomType: "point",
      value: 3,
      vectorOptions: {
        type: "square",
        radius: 10,
        rotation: 0.7853981633974483,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
  ],
} as unknown as GeoAdminGeoJSONStyleDefinition;

describe("geoadminToMapLibreStyle - unique (hydroweb grundwasser)", () => {
  const { style, icons } = geoadminToMapLibreStyle(HYDROWEB_UNIQUE, "src");

  it("produces a valid MapLibre style shell with one geojson source", () => {
    expect(style.version).toBe(8);
    expect(Object.keys(style.sources)).toEqual(["src"]);
    expect(style.sources.src!.type).toBe("geojson");
  });

  it("emits one layer per unique value, all bound to the source", () => {
    expect(style.layers).toHaveLength(3);
    style.layers.forEach((layer) => {
      expect(layer.source).toBe("src");
    });
  });

  it("filters each layer by the discriminating property and value (type-tolerant)", () => {
    expect(style.layers[0]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "2",
    ]);
    expect(style.layers[1]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "1",
    ]);
    expect(style.layers[2]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "3",
    ]);
  });

  it("maps a circle shape to a native circle layer", () => {
    const circle = style.layers[0]!;
    expect(circle.type).toBe("circle");
    expect(circle.paint).toMatchObject({
      "circle-radius": 8,
      "circle-color": "#808080",
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 1,
    });
  });

  it("maps non-circle shapes to symbol layers with generated icons", () => {
    const triangle = style.layers[1]!;
    const square = style.layers[2]!;
    expect(triangle.type).toBe("symbol");
    expect(square.type).toBe("symbol");
    expect(triangle.layout!["icon-image"]).toBeTypeOf("string");
    expect(triangle.layout!["icon-rotation-alignment"]).toBe("map");
  });

  it("converts geoadmin rotation (radians) to MapLibre icon-rotate (degrees)", () => {
    const triangle = style.layers[1]!;
    const square = style.layers[2]!;
    expect(triangle.layout!["icon-rotate"]).toBeCloseTo(60, 5);
    expect(square.layout!["icon-rotate"]).toBeCloseTo(45, 5);
  });

  it("collects one icon spec per distinct non-circle shape", () => {
    expect(icons).toHaveLength(2);
    const shapes = icons.map((icon) => icon.shape).sort();
    expect(shapes).toEqual(["square", "triangle"]);
    const triangleIcon = icons.find((icon) => icon.shape === "triangle")!;
    expect(triangleIcon).toMatchObject({
      radius: 12,
      fillColor: "#808080",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
    });
    // The symbol layer references the icon by its generated name.
    expect(style.layers[1]!.layout!["icon-image"]).toBe(triangleIcon.name);
  });
});

describe("geoadminToMapLibreStyle - circle point with a label", () => {
  // A `circle` layer can't carry a `text-field`, so the converter must emit a
  // separate symbol text layer; otherwise circle-point labels are dropped
  // (the ~44 meteoschweiz/hydroweb measurement layers).
  const CIRCLE_WITH_LABEL = {
    type: "single",
    property: "id",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 6,
      fill: { color: "#1d6ec9" },
      label: {
        template: "${station_name}",
        text: {
          font: "bold 12px Arial",
          fill: { color: "white" },
          backgroundFill: { color: "rgba(14,80,114,0.9)" },
          padding: [2, 2, 2, 2],
        },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  const { style } = geoadminToMapLibreStyle(CIRCLE_WITH_LABEL, "src");

  it("emits a circle layer AND a companion symbol text layer", () => {
    expect(style.layers).toHaveLength(2);
    expect(style.layers[0]!.type).toBe("circle");
    const label = style.layers[1]!;
    expect(label.type).toBe("symbol");
    expect(label.layout!["text-field"]).toEqual(["get", "station_name"]);
  });

  it("carries the label background box into the symbol layer metadata", () => {
    const label = style.layers[1]!;
    expect(label.metadata!["ol:text-background"]).toMatchObject({
      fill: "rgba(14,80,114,0.9)",
      padding: [2, 2, 2, 2],
    });
  });
});

describe("geoadminToMapLibreStyle - range (polygon)", () => {
  const RANGE: GeoAdminGeoJSONStyleDefinition = {
    type: "range",
    property: "value",
    ranges: [
      {
        geomType: "polygon",
        range: [0, 10],
        vectorOptions: {
          type: "square",
          fill: { color: "#ff0000" },
          stroke: { color: "#000000", width: 2 },
        },
      },
    ],
  };
  // Polygon fill + outline are merged into shared data-driven layers; the range
  // selection lives in the paint expression, not a per-layer filter.
  const rangeCond = [
    "all",
    [">=", ["to-number", ["get", "value"]], 0],
    ["<", ["to-number", ["get", "value"]], 10],
  ];

  it("merges polygon fill + outline into shared data-driven layers", () => {
    const { style } = geoadminToMapLibreStyle(RANGE, "src");
    const fill = style.layers.find((layer) => layer.type === "fill")!;
    const stroke = style.layers.find((layer) => layer.type === "line")!;

    // No per-entry filter on the fill; the range drives fill-color via a case.
    expect(fill.filter).toBeUndefined();
    expect(fill.paint!["fill-color"]).toEqual([
      "case",
      rangeCond,
      "#ff0000",
      "rgba(0, 0, 0, 0)",
    ]);

    // Only polygon outlines here, so the shared line layer is filtered to polygons.
    expect(stroke.filter).toEqual(["==", ["geometry-type"], "Polygon"]);
    expect(stroke.paint!["line-color"]).toEqual([
      "case",
      rangeCond,
      "#000000",
      "rgba(0, 0, 0, 0)",
    ]);
    expect(stroke.paint!["line-width"]).toEqual(["case", rangeCond, 2, 0]);
  });
});

describe("geoadminToMapLibreStyle - mixed polygon/line unique (draw-order fix)", () => {
  // A warnkarte-shaped style: the same property value maps to a polygon fill/outline
  // AND a line stroke. Merging every polygon into one fill layer and every stroke into
  // one line layer restores the legacy renderer's source-order drawing (GPS-732 finding
  // C: previously the last entries painted over everything).
  const MIXED = {
    type: "unique",
    property: "ws-class",
    values: [
      {
        geomType: "polygon",
        value: 0,
        vectorOptions: {
          fill: { color: "#CCCCCC" },
          stroke: { color: "#FFFFFF", width: 1 },
        },
      },
      {
        geomType: "polygon",
        value: 1,
        vectorOptions: {
          fill: { color: "#CCFF66" },
          stroke: { color: "#FFFFFF", width: 1 },
        },
      },
      {
        geomType: "line",
        value: 0,
        vectorOptions: { stroke: { color: "#CCCCCC", width: 3 } },
      },
      {
        geomType: "line",
        value: 1,
        vectorOptions: { stroke: { color: "#CCFF66", width: 3 } },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const { style } = geoadminToMapLibreStyle(MIXED, "src");

  it("collapses all polygons into ONE fill layer and all strokes into ONE line layer", () => {
    expect(style.layers.filter((l) => l.type === "fill")).toHaveLength(1);
    expect(style.layers.filter((l) => l.type === "line")).toHaveLength(1);
    expect(style.layers).toHaveLength(2);
  });

  it("drives fill-color with a match over the style property, no per-entry filter", () => {
    const fill = style.layers.find((l) => l.type === "fill")!;
    expect(fill.filter).toBeUndefined();
    expect(fill.paint!["fill-color"]).toEqual([
      "match",
      ["to-string", ["get", "ws-class"]],
      "0",
      "#CCCCCC",
      "1",
      "#CCFF66",
      "rgba(0, 0, 0, 0)",
    ]);
  });

  it("branches stroke paint on geometry-type (polygon outline vs line geometry)", () => {
    const stroke = style.layers.find((l) => l.type === "line")!;
    // Both geometries present -> case on geometry-type, so no per-layer filter.
    expect(stroke.filter).toBeUndefined();
    expect(stroke.paint!["line-color"]).toEqual([
      "case",
      ["==", ["geometry-type"], "Polygon"],
      [
        "match",
        ["to-string", ["get", "ws-class"]],
        "0",
        "#FFFFFF",
        "1",
        "#FFFFFF",
        "rgba(0, 0, 0, 0)",
      ],
      [
        "match",
        ["to-string", ["get", "ws-class"]],
        "0",
        "#CCCCCC",
        "1",
        "#CCFF66",
        "rgba(0, 0, 0, 0)",
      ],
    ]);
    expect(stroke.paint!["line-width"]).toEqual([
      "case",
      ["==", ["geometry-type"], "Polygon"],
      ["match", ["to-string", ["get", "ws-class"]], "0", 1, "1", 1, 0],
      ["match", ["to-string", ["get", "ws-class"]], "0", 3, "1", 3, 0],
    ]);
  });

  it("orders fill below stroke", () => {
    expect(style.layers[0]!.type).toBe("fill");
    expect(style.layers[1]!.type).toBe("line");
  });
});

describe("geoadminToMapLibreStyle - data-driven rotation (wind direction)", () => {
  // Real geoadmin shape: rotation sits beside `vectorOptions` and names a feature
  // property (radians), e.g. ch.meteoschweiz.messwerte-wind-boeenspitze-kmh-10min.
  const WIND = {
    type: "range",
    property: "value",
    ranges: [
      {
        geomType: "point",
        range: [5, 11],
        rotation: "wind_direction_radian",
        vectorOptions: {
          type: "icon",
          src: "https://data.geo.admin.ch/arrow16.png",
        },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("emits a data-driven icon-rotate expression (radians -> degrees) per feature", () => {
    const { style } = geoadminToMapLibreStyle(WIND, "src");
    const symbol = style.layers.find((layer) => layer.type === "symbol")!;
    expect(symbol.layout!["icon-rotate"]).toEqual([
      "*",
      ["to-number", ["get", "wind_direction_radian"]],
      180 / Math.PI,
    ]);
    expect(symbol.layout!["icon-rotation-alignment"]).toBe("map");
  });
});

describe("geoadminToMapLibreStyle - single line", () => {
  const SINGLE: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "line",
    vectorOptions: {
      type: "square",
      fill: { color: "#000000" },
      stroke: { color: "#0000ff", width: 3 },
    },
  };

  it("emits one line layer with static paint, filtered to line geometries", () => {
    const { style } = geoadminToMapLibreStyle(SINGLE, "src");
    expect(style.layers).toHaveLength(1);
    const line = style.layers[0]!;
    expect(line.type).toBe("line");
    // The shared line layer would also stroke polygons (a MapLibre `line` layer applies
    // to both), so a line-only style is filtered to line geometries.
    expect(line.filter).toEqual(["==", ["geometry-type"], "LineString"]);
    expect(line.paint).toMatchObject({
      "line-color": "#0000ff",
      "line-width": 3,
    });
  });
});

describe("geoadminToMapLibreStyle - resolutionToZoom", () => {
  it("maps min/maxResolution to inverse maxzoom/minzoom when supplied", () => {
    const def: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "n/a",
      geomType: "point",
      minResolution: 2,
      maxResolution: 100,
      vectorOptions: {
        type: "circle",
        radius: 5,
        fill: { color: "#808080" },
        stroke: { color: "#fff", width: 1 },
      },
    };
    // Fake mapping: zoom = 20 - log2(resolution)-ish; just needs to be monotonic.
    const resolutionToZoom = (res: number) => 20 - Math.log2(res);
    const { style } = geoadminToMapLibreStyle(def, "src", { resolutionToZoom });
    const circle = style.layers[0]!;
    // minResolution (2) -> maxzoom; maxResolution (100) -> minzoom. Both bounds are
    // shifted up by one zoom level so the inclusive geoadmin band edge survives
    // MapLibre's exclusive maxzoom (see applyCommon).
    expect(circle.maxzoom).toBeCloseTo(20 - Math.log2(2) + 1, 5);
    expect(circle.minzoom).toBeCloseTo(20 - Math.log2(100) + 1, 5);
  });
});

describe("labelTemplateToExpression", () => {
  it("returns a bare get for a single token", () => {
    expect(labelTemplateToExpression("${name}")).toEqual(["get", "name"]);
  });

  it("builds a concat for mixed templates", () => {
    expect(labelTemplateToExpression("${name} (${code})")).toEqual([
      "concat",
      ["get", "name"],
      " (",
      ["get", "code"],
      ")",
    ]);
  });

  it("returns the literal string when there are no tokens", () => {
    expect(labelTemplateToExpression("static")).toBe("static");
  });
});

describe("parseCssFont", () => {
  it("extracts size and family stack from a CSS font shorthand", () => {
    expect(
      parseCssFont("bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif"),
    ).toEqual({
      size: 12,
      families: ["FrutigerNeueW02-Regular", "Frutiger", "sans-serif"],
    });
  });
});

describe("makeGetImage", () => {
  it("returns a URL string for icon-image URLs not in the icon set", () => {
    const getImage = makeGetImage([]);
    const url = "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png";
    // first arg (layer) is unused by the callback
    expect(getImage({} as never, url)).toBe(url);
    expect(getImage({} as never, "not-a-url")).toBeUndefined();
  });
});

// The doc's reference example: ch.bafu.hydroweb-messstationen_grundwassertemperatur
// (icon type + label + resolution bands). Verifies the fixes the GEOIN doc surfaced.
const GRUNDWASSERTEMPERATUR = {
  type: "unique",
  property: "quant-class",
  values: [
    {
      geomType: "point",
      value: 0,
      minResolution: 100,
      vectorOptions: {
        type: "icon",
        src: "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png",
      },
    },
    {
      geomType: "point",
      value: 0,
      maxResolution: 100,
      vectorOptions: {
        type: "icon",
        src: "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata16.png",
        label: {
          template: "${name}",
          text: {
            textAlign: "center",
            textBaseline: "middle",
            font: "bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif",
            scale: 1,
            offsetY: -28,
            padding: [2, 2, 2, 2],
            stroke: { color: "rgba(14,80,114,0.9)", width: 3 },
            backgroundFill: { color: "rgba(14,80,114,0.9)" },
            fill: { color: "white" },
          },
        },
      },
    },
  ],
} as unknown as GeoAdminGeoJSONStyleDefinition;

describe("geoadminToMapLibreStyle - icon + label + resolution (doc reference)", () => {
  // res 100 -> zoom 14, matching the doc's expected conversion.
  const resolutionToZoom = (res: number) => (res === 100 ? 14 : 0);
  const { style, icons } = geoadminToMapLibreStyle(
    GRUNDWASSERTEMPERATUR,
    "src",
    { resolutionToZoom },
  );

  it("emits two symbol layers, no generated shape icons", () => {
    expect(style.layers).toHaveLength(2);
    expect(style.layers.every((l) => l.type === "symbol")).toBe(true);
    expect(icons).toHaveLength(0);
  });

  it("uses the icon src URL as icon-image and maps resolution to zoom", () => {
    const small = style.layers[0]!;
    expect(small.layout!["icon-image"]).toBe(
      "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png",
    );
    expect(small.filter).toEqual([
      "==",
      ["to-string", ["get", "quant-class"]],
      "0",
    ]);
    // minResolution 100 -> zoom 14, +1 so the inclusive band edge survives
    // MapLibre's exclusive maxzoom.
    expect(small.maxzoom).toBe(15);
    expect(small.minzoom).toBeUndefined();
  });

  it("converts the label faithfully (font stack, px->em offset, halo)", () => {
    const large = style.layers[1]!;
    expect(large.minzoom).toBe(15); // maxResolution 100 -> zoom 14, +1 boundary shift
    expect(large.layout!["text-field"]).toEqual(["get", "name"]);
    expect(large.layout!["text-font"]).toEqual([
      "FrutigerNeueW02-Regular",
      "Frutiger",
      "sans-serif",
    ]);
    expect(large.layout!["text-size"]).toBe(12);
    expect(large.layout!["text-anchor"]).toBe("center");
    // -28px / 12px ≈ -2.33em (the doc rounds to -2.3)
    expect((large.layout!["text-offset"] as number[])[1]).toBeCloseTo(
      -28 / 12,
      5,
    );
    expect(large.paint!["text-color"]).toBe("white");
    expect(large.paint!["text-halo-color"]).toBe("rgba(14,80,114,0.9)");
    expect(large.paint!["text-halo-width"]).toBe(3);
  });

  it("carries the label background as ol:text-background metadata", () => {
    // MapLibre has no text-background paint, so the geoadmin backgroundFill is
    // stashed on metadata for the OpenLayers side to re-apply (applyOlTextBackground).
    const large = style.layers[1]!;
    expect(large.metadata!["ol:text-background"]).toEqual({
      fill: "rgba(14,80,114,0.9)",
      padding: [2, 2, 2, 2],
    });
  });
});

describe("geoadminToMapLibreStyle - unsupported vectorOptions.type", () => {
  const UNSUPPORTED: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: { type: "diamond" } as never,
  };

  it("logs a warning and emits no layer for the entry", () => {
    vi.mocked(log.warn).mockClear();
    const { style } = geoadminToMapLibreStyle(UNSUPPORTED, "src");
    expect(style.layers).toHaveLength(0);
    expect(log.warn).toHaveBeenCalledOnce();
  });
});

describe("geoadminToMapLibreStyle - unsupported geomType", () => {
  const UNSUPPORTED: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "multipolygon" as never,
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#fff" },
      stroke: { color: "#000", width: 1 },
    },
  };

  it("logs a warning and emits no layer", () => {
    vi.mocked(log.warn).mockClear();
    const { style } = geoadminToMapLibreStyle(UNSUPPORTED, "src");
    expect(style.layers).toHaveLength(0);
    expect(log.warn).toHaveBeenCalledOnce();
  });
});

describe("geoadminToMapLibreStyle - single-type root-level rotation", () => {
  // For `single`, `rotation` is a sibling of `vectorOptions` on the style root
  // itself, not on `vectorOptions` (mirrors web-mapviewer's imageRotationProperty).
  const SINGLE_ROOT_ROTATION = {
    type: "single",
    property: "n/a",
    geomType: "point",
    rotation: "bearing",
    vectorOptions: {
      type: "icon",
      src: "https://data.geo.admin.ch/arrow.png",
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("applies the root-level rotation as a data-driven icon-rotate expression", () => {
    const { style } = geoadminToMapLibreStyle(SINGLE_ROOT_ROTATION, "src");
    expect(style.layers[0]!.layout!["icon-rotate"]).toEqual([
      "*",
      ["to-number", ["get", "bearing"]],
      180 / Math.PI,
    ]);
  });
});

describe("geoadminToMapLibreStyle - circle without fill or stroke", () => {
  const CIRCLE_BARE = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: { type: "circle", radius: 5 },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("omits circle-color and circle-stroke paint keys", () => {
    const { style } = geoadminToMapLibreStyle(CIRCLE_BARE, "src");
    const circle = style.layers[0]!;
    expect(circle.paint).toEqual({ "circle-radius": 5 });
  });
});

describe("geoadminToMapLibreStyle - icon with scale", () => {
  const ICON_SCALED = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "icon",
      src: "https://data.geo.admin.ch/pin.png",
      scale: 0.5,
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("maps scale to icon-size", () => {
    const { style } = geoadminToMapLibreStyle(ICON_SCALED, "src");
    expect(style.layers[0]!.layout!["icon-size"]).toBe(0.5);
  });
});

describe("geoadminToMapLibreStyle - shape icon with default radius", () => {
  const SHAPE_NO_RADIUS = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "hexagon",
      fill: { color: "#fff" },
      stroke: { color: "#000", width: 1 },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("defaults radius to 8 when the shape doesn't declare one", () => {
    const { icons } = geoadminToMapLibreStyle(SHAPE_NO_RADIUS, "src");
    expect(icons[0]!.radius).toBe(8);
  });
});

describe("geoadminToMapLibreStyle - stroke width default", () => {
  const NO_WIDTH: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: {
      type: "square",
      fill: { color: "#ff0000" },
      stroke: { color: "#000000" } as never,
    },
  };

  it("defaults line-width to 1 when stroke.width is omitted", () => {
    const { style } = geoadminToMapLibreStyle(NO_WIDTH, "src");
    const stroke = style.layers.find((l) => l.type === "line")!;
    expect(stroke.paint!["line-width"]).toBe(1);
  });
});

describe("geoadminToMapLibreStyle - label without a background box", () => {
  const LABEL_NO_BG = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      label: {
        template: "${name}",
        text: { fill: { color: "white" } },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("emits no metadata when there is no background", () => {
    const { style } = geoadminToMapLibreStyle(LABEL_NO_BG, "src");
    const label = style.layers.find((l) => l.type === "symbol")!;
    expect(label.metadata).toBeUndefined();
  });
});

describe("geoadminToMapLibreStyle - label backgroundStroke without backgroundFill", () => {
  const LABEL_BG_STROKE_ONLY = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      label: {
        template: "${name}",
        text: {
          fill: { color: "white" },
          backgroundStroke: { color: "#123456", width: 2 },
        },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("carries the stroke without a fill key", () => {
    const { style } = geoadminToMapLibreStyle(LABEL_BG_STROKE_ONLY, "src");
    const label = style.layers.find((l) => l.type === "symbol")!;
    expect(label.metadata!["ol:text-background"]).toMatchObject({
      stroke: { color: "#123456", width: 2 },
    });
    expect(
      (label.metadata!["ol:text-background"] as Record<string, unknown>).fill,
    ).toBeUndefined();
  });
});

describe("geoadminToMapLibreStyle - polygon with fill only (no stroke declared)", () => {
  const FILL_ONLY: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: { type: "square", fill: { color: "#ff0000" } } as never,
  };

  it("emits a fill layer but no line layer", () => {
    const { style } = geoadminToMapLibreStyle(FILL_ONLY, "src");
    expect(style.layers.some((l) => l.type === "fill")).toBe(true);
    expect(style.layers.some((l) => l.type === "line")).toBe(false);
  });
});

describe("geoadminToMapLibreStyle - polygon with stroke only (no fill declared)", () => {
  const STROKE_ONLY: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: {
      type: "square",
      stroke: { color: "#000000", width: 2 },
    } as never,
  };

  it("emits a line layer but no fill layer", () => {
    const { style } = geoadminToMapLibreStyle(STROKE_ONLY, "src");
    expect(style.layers.some((l) => l.type === "fill")).toBe(false);
    expect(style.layers.some((l) => l.type === "line")).toBe(true);
  });
});

describe("geoadminToMapLibreStyle - polygon/line entries split across zoom bands", () => {
  const MULTI_BAND = {
    type: "unique",
    property: "cls",
    values: [
      {
        geomType: "polygon",
        value: 0,
        maxResolution: 100,
        vectorOptions: { fill: { color: "#ff0000" } },
      },
      {
        geomType: "polygon",
        value: 1,
        minResolution: 100,
        vectorOptions: { fill: { color: "#00ff00" } },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const resolutionToZoom = (res: number) => 20 - Math.log2(res);

  it("emits one suffixed fill layer per zoom band", () => {
    const { style } = geoadminToMapLibreStyle(MULTI_BAND, "src", {
      resolutionToZoom,
    });
    const fills = style.layers.filter((l) => l.type === "fill");
    expect(fills).toHaveLength(2);
    expect(fills[0]!.id).toBe("src-fill-0");
    expect(fills[1]!.id).toBe("src-fill-1");
  });
});

describe("geoadminToMapLibreStyle - label on a polygon entry", () => {
  const POLYGON_WITH_LABEL = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: {
      type: "square",
      fill: { color: "#ff0000" },
      stroke: { color: "#000000", width: 1 },
      label: { template: "${name}", text: { fill: { color: "white" } } },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("emits a separate symbol label layer alongside the fill/line layers", () => {
    const { style } = geoadminToMapLibreStyle(POLYGON_WITH_LABEL, "src");
    expect(style.layers.map((l) => l.type)).toEqual(["fill", "line", "symbol"]);
    expect(style.layers[2]!.layout!["text-field"]).toEqual(["get", "name"]);
  });
});

describe("parseCssFont - edge cases", () => {
  it("returns an empty object when there's no px size", () => {
    expect(parseCssFont("sans-serif")).toEqual({});
  });

  it("strips quotes from quoted family names", () => {
    expect(parseCssFont('12px "Comic Sans MS", sans-serif')).toEqual({
      size: 12,
      families: ["Comic Sans MS", "sans-serif"],
    });
  });
});

describe("geoadminToMapLibreStyle - text-anchor combinations", () => {
  const LABEL_TOP_LEFT = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      label: {
        template: "${name}",
        text: {
          textBaseline: "top",
          textAlign: "left",
          fill: { color: "white" },
        },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const LABEL_BOTTOM_START = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      label: {
        template: "${name}",
        text: {
          textBaseline: "bottom",
          textAlign: "start",
          fill: { color: "white" },
        },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("maps top/left to text-anchor top-left and sets text-justify", () => {
    const { style } = geoadminToMapLibreStyle(LABEL_TOP_LEFT, "src");
    const label = style.layers.find((l) => l.type === "symbol")!;
    expect(label.layout!["text-anchor"]).toBe("top-left");
    expect(label.layout!["text-justify"]).toBe("left");
  });

  it("maps bottom/start to text-anchor bottom-left without text-justify", () => {
    const { style } = geoadminToMapLibreStyle(LABEL_BOTTOM_START, "src");
    const label = style.layers.find((l) => l.type === "symbol")!;
    expect(label.layout!["text-anchor"]).toBe("bottom-left");
    expect(label.layout!["text-justify"]).toBeUndefined();
  });
});
