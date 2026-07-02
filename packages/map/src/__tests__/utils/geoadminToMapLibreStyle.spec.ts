import { describe, it, expect } from "vitest";

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
