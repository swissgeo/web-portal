import log, { LogPreDefinedColor } from "@swissgeo/log";

import type {
  GeoAdminGeoJSONStyleDefinition,
  GeoAdminGeoJSONStyleSingle,
  GeoAdminGeoJSONVectorOptions,
} from "@/utils/geojson";

import type { ShapeIconSpec, ShapeIconType } from "./maplibreShapeIcons";

import { shapeIconName } from "./maplibreShapeIcons";

// `GeoAdminGeoJSONLabel` is not exported from @/utils/geojson, so we derive
// it from the vector options type.
type GeoAdminLabel = NonNullable<GeoAdminGeoJSONVectorOptions["label"]>;

/**
 * Converts geoadmin's proprietary GeoJSON "literals" style (`single` / `unique` /
 * `range`) into a standard MapLibre / mapbox-gl style object, so that GeoJSON layers
 * can be rendered through `ol-mapbox-style` instead of the bespoke
 * {@link OlStyleForPropertyValue} converter.
 *
 * This is the reusable core that an offline batch job would call to convert all ~60
 * geoadmin styles once. For the POC it is also called at runtime (see the debug
 * panel demo) to prove the pipeline against a real style.
 *
 * Known POC limitations (documented, not blocking):
 * - Multi-token label templates beyond a single `${prop}` are converted best-effort.
 * - `minResolution`/`maxResolution` are mapped to `minzoom`/`maxzoom` only when a
 *   `resolutionToZoom` function is supplied.
 * - Draw order differs from the legacy renderer. Each style entry (unique value /
 *   range) becomes its own MapLibre layer, and layers paint strictly in array order,
 *   so every feature of one entry paints under every feature of the next — and
 *   circles vs. shapes land in different layer *types* (`circle` vs. `symbol`) that
 *   cannot share a layer. The legacy `OlStyleForPropertyValue` instead drew every
 *   feature in a single OpenLayers vector layer in feature/source order, so shapes
 *   interleaved per-feature. MapLibre groups by style entry; the legacy interleaves
 *   by feature. There is no faithful 1:1 mapping (see e.g.
 *   ch.bafu.hydroweb-messstationen_vorhersage: triangle-over-circle ordering varies).
 */

// --- Minimal MapLibre style typings (only the subset we emit) -----------------

type MapLibreExpression = unknown[];

export type MapLibreLayerType = "circle" | "line" | "fill" | "symbol";

export interface MapLibreLayer {
  id: string;
  type: MapLibreLayerType;
  source: string;
  filter?: MapLibreExpression;
  minzoom?: number;
  maxzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

export interface MapLibreStyle {
  version: 8;
  sources: Record<string, { type: "geojson"; data: unknown }>;
  layers: MapLibreLayer[];
}

export interface GeoadminToMapLibreOptions {
  /**
   * Maps an OpenLayers resolution to a MapLibre zoom level. When provided, geoadmin
   * `minResolution`/`maxResolution` bands are translated to `minzoom`/`maxzoom`
   * (zoom is inverse to resolution). When omitted, zoom bounds are not emitted.
   */
  resolutionToZoom?: (resolution: number) => number;
}

export interface GeoadminToMapLibreResult {
  style: MapLibreStyle;
  /** Generated point-shape icons (non-circle shapes) the renderer must supply. */
  icons: ShapeIconSpec[];
}

// --- A normalized view over the three geoadmin style shapes -------------------

interface NormalizedEntry {
  geomType?: string;
  vectorOptions?: GeoAdminGeoJSONVectorOptions;
  minResolution?: number;
  maxResolution?: number;
  filter?: MapLibreExpression;
  // A number is a static rotation angle (radians); a string names the feature
  // property holding the angle (data-driven, e.g. wind direction).
  rotation?: string | number;
}

/**
 * geoadmin carries rotation as a sibling of `vectorOptions` on each style entry
 * (and on the style root for `single`). Mirrors web-mapviewer's
 * `imageRotationProperty`.
 */
function extractRotation(entry: object): string | number | undefined {
  return "rotation" in entry
    ? (entry as { rotation?: string | number }).rotation
    : undefined;
}

function normalizeEntries(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
): NormalizedEntry[] {
  if (geoadmin.type === "single") {
    const single = geoadmin as GeoAdminGeoJSONStyleSingle;
    return [
      {
        geomType: single.geomType,
        vectorOptions: single.vectorOptions,
        minResolution: single.minResolution,
        maxResolution: single.maxResolution,
        rotation: extractRotation(single),
      },
    ];
  }

  if (geoadmin.type === "unique") {
    return geoadmin.values.map((value) => ({
      geomType: value.geomType,
      vectorOptions: value.vectorOptions,
      minResolution: value.minResolution,
      maxResolution: value.maxResolution,
      rotation: extractRotation(value),
      // geoadmin data often encodes the discriminating value as a string (e.g.
      // "2"), while the style value may be numeric — MapLibre's `==` is
      // type-strict, so compare both as strings.
      filter: [
        "==",
        ["to-string", ["get", geoadmin.property]],
        String(value.value),
      ],
    }));
  }

  // range
  return geoadmin.ranges.map((range) => ({
    geomType: range.geomType,
    vectorOptions: range.vectorOptions,
    minResolution: range.minResolution,
    maxResolution: range.maxResolution,
    rotation: extractRotation(range),
    // Coerce the property to a number so string-encoded values compare correctly.
    filter: [
      "all",
      [">=", ["to-number", ["get", geoadmin.property]], range.range[0]],
      ["<", ["to-number", ["get", geoadmin.property]], range.range[1]],
    ],
  }));
}

// --- Label template conversion ------------------------------------------------

/**
 * Converts a geoadmin label template (e.g. `"${name} (${code})"`) into a MapLibre
 * `text-field` expression. A single bare `${prop}` becomes `["get", "prop"]`; mixed
 * templates become a `["concat", ...]` of literals and `["get", ...]` lookups.
 */
export function labelTemplateToExpression(
  template: string,
): string | MapLibreExpression {
  const tokenPattern = /\$\{([^}]+)\}/g;
  const parts: (string | MapLibreExpression)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push(template.slice(lastIndex, match.index));
    }
    parts.push(["get", match[1]]);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }

  if (parts.length === 0) {
    return "";
  }
  // A single `["get", prop]` can be used directly as the text-field expression.
  if (parts.length === 1) {
    return parts[0]!;
  }
  return ["concat", ...parts];
}

interface ParsedFont {
  size?: number;
  families?: string[];
}

/**
 * geoadmin labels carry a CSS font shorthand, e.g.
 * `"bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif"`. Extract the pixel
 * size and the family stack (MapLibre `text-font` is an array of family names).
 */
export function parseCssFont(font: string): ParsedFont {
  const result: ParsedFont = {};
  const sizeMatch = /(\d+(?:\.\d+)?)px/.exec(font);
  if (sizeMatch) {
    result.size = parseFloat(sizeMatch[1]!);
    const familyPart = font.slice(sizeMatch.index + sizeMatch[0].length).trim();
    if (familyPart) {
      result.families = familyPart
        .split(",")
        .map((family) => family.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return result;
}

const VERTICAL_ANCHOR: Record<string, string> = {
  top: "top",
  hanging: "top",
  middle: "",
  alphabetic: "bottom",
  ideographic: "bottom",
  bottom: "bottom",
};
const HORIZONTAL_ANCHOR: Record<string, string> = {
  left: "left",
  start: "left",
  center: "",
  right: "right",
  end: "right",
};

/** Maps canvas textBaseline/textAlign to the closest MapLibre `text-anchor`. */
function textAnchor(baseline?: string, align?: string): string {
  const parts = [
    VERTICAL_ANCHOR[baseline ?? ""] ?? "",
    HORIZONTAL_ANCHOR[align ?? ""] ?? "",
  ].filter(Boolean);
  return parts.length ? parts.join("-") : "center";
}

function textPaintAndLayout(label: GeoAdminLabel): {
  layout: Record<string, unknown>;
  paint: Record<string, unknown>;
} {
  const font = label.text.font ? parseCssFont(label.text.font) : {};

  const layout: Record<string, unknown> = {
    "text-field": labelTemplateToExpression(label.template),
    "text-allow-overlap": true,
  };
  if (font.size !== undefined) {
    layout["text-size"] = font.size;
  }
  if (font.families?.length) {
    layout["text-font"] = font.families;
  }
  layout["text-anchor"] = textAnchor(
    label.text.textBaseline,
    label.text.textAlign,
  );
  if (["left", "center", "right"].includes(label.text.textAlign)) {
    layout["text-justify"] = label.text.textAlign;
  }
  if (label.text.offsetX !== undefined || label.text.offsetY !== undefined) {
    // geoadmin offsets are pixels; MapLibre text-offset is in ems, so divide by
    // the font size (fall back to MapLibre's default text-size of 16).
    const em = font.size ?? 16;
    layout["text-offset"] = [
      (label.text.offsetX ?? 0) / em,
      (label.text.offsetY ?? 0) / em,
    ];
  }

  const paint: Record<string, unknown> = {};
  if (label.text.fill?.color) {
    paint["text-color"] = label.text.fill.color;
  }
  if (label.text.stroke?.color) {
    paint["text-halo-color"] = label.text.stroke.color;
    paint["text-halo-width"] = label.text.stroke.width ?? 1;
  }
  return { layout, paint };
}

// --- Per-entry layer building -------------------------------------------------

const NON_CIRCLE_SHAPES: ShapeIconType[] = [
  "square",
  "triangle",
  "pentagon",
  "star",
  "cross",
  "hexagon",
];

function isShapeIconType(type: string): type is ShapeIconType {
  return type === "circle" || NON_CIRCLE_SHAPES.includes(type as ShapeIconType);
}

interface BuildContext {
  sourceId: string;
  baseId: string;
  index: number;
  options: GeoadminToMapLibreOptions;
  icons: ShapeIconSpec[];
}

function applyCommon(
  layer: MapLibreLayer,
  entry: NormalizedEntry,
  ctx: BuildContext,
): MapLibreLayer {
  if (entry.filter) {
    layer.filter = entry.filter;
  }
  const toZoom = ctx.options.resolutionToZoom;
  if (toZoom) {
    // Zoom is inverse to resolution: the smallest resolution (minResolution) is the
    // most zoomed-in level (maxzoom), and vice-versa.
    //
    // geoadmin bands are half-open with the LOWER (minResolution) bound inclusive:
    // an entry applies when `minResolution <= resolution < maxResolution`. MapLibre's
    // zoom window is the mirror image — `minzoom <= zoom < maxzoom`, with maxzoom
    // EXCLUSIVE. `resolutionToZoom` snaps to an integer grid level, so a band edge
    // lands exactly on a rest zoom level; we add 1 to both bounds to keep that edge
    // level on the same side as the legacy renderer. Without it the next entry takes
    // over one zoom level too early (e.g. messnetz-beobachtungen rendering its larger
    // labelled circle already at zoom 1 instead of zoom 2). Assumes grid-aligned band
    // resolutions, which all production geoadmin styles use.
    if (entry.minResolution !== undefined && entry.minResolution > 0) {
      layer.maxzoom = toZoom(entry.minResolution) + 1;
    }
    if (entry.maxResolution !== undefined && entry.maxResolution !== Infinity) {
      layer.minzoom = toZoom(entry.maxResolution) + 1;
    }
  }
  return layer;
}

function buildLayersForEntry(
  entry: NormalizedEntry,
  ctx: BuildContext,
): MapLibreLayer[] {
  const { vectorOptions, geomType } = entry;
  const layers: MapLibreLayer[] = [];
  const idPrefix = `${ctx.baseId}-${ctx.index}`;

  if (geomType === "polygon") {
    const fill: MapLibreLayer = {
      id: `${idPrefix}-fill`,
      type: "fill",
      source: ctx.sourceId,
      paint: {},
    };
    if (vectorOptions && "fill" in vectorOptions && vectorOptions.fill?.color) {
      fill.paint!["fill-color"] = vectorOptions.fill.color;
    }
    layers.push(applyCommon(fill, entry, ctx));

    if (
      vectorOptions &&
      "stroke" in vectorOptions &&
      vectorOptions.stroke?.color
    ) {
      const outline: MapLibreLayer = {
        id: `${idPrefix}-outline`,
        type: "line",
        source: ctx.sourceId,
        paint: {
          "line-color": vectorOptions.stroke.color,
          "line-width": vectorOptions.stroke.width ?? 1,
        },
      };
      layers.push(applyCommon(outline, entry, ctx));
    }
  } else if (geomType === "line") {
    const line: MapLibreLayer = {
      id: `${idPrefix}-line`,
      type: "line",
      source: ctx.sourceId,
      paint: {},
    };
    if (
      vectorOptions &&
      "stroke" in vectorOptions &&
      vectorOptions.stroke?.color
    ) {
      line.paint!["line-color"] = vectorOptions.stroke.color;
      line.paint!["line-width"] = vectorOptions.stroke.width ?? 1;
    }
    layers.push(applyCommon(line, entry, ctx));
  } else if (geomType === "point" && vectorOptions) {
    layers.push(...buildPointLayers(entry, vectorOptions, ctx, idPrefix));
  } else if (vectorOptions) {
    log.warn({
      title: "geoadminToMapLibreStyle",
      titleColor: LogPreDefinedColor.Orange,
      messages: ["Unsupported geomType, skipping entry", geomType],
    });
  }

  // A label on a non-point entry needs its own symbol layer (point shapes fold the
  // label into their symbol layer below).
  if (geomType !== "point" && vectorOptions?.label) {
    layers.push(buildLabelLayer(entry, vectorOptions.label, ctx, idPrefix));
  }

  return layers;
}

/**
 * Resolves the rotation for a point symbol. An entry-level rotation (a feature
 * property name, data-driven) takes precedence — matching web-mapviewer, where
 * `imageRotationProperty` overrides the static angle. Otherwise a static numeric
 * rotation declared inside `vectorOptions` is used.
 */
function resolveRotation(
  entry: NormalizedEntry,
  vectorOptions: GeoAdminGeoJSONVectorOptions,
): string | number | undefined {
  if (entry.rotation !== undefined) {
    return entry.rotation;
  }
  return "rotation" in vectorOptions
    ? (vectorOptions as { rotation?: number }).rotation
    : undefined;
}

/**
 * Applies a geoadmin rotation (radians) to a symbol layer as MapLibre
 * `icon-rotate` (degrees). A number is a static angle; a string names the
 * feature property holding the angle, which becomes a data-driven expression so
 * each feature rotates independently (e.g. wind direction).
 */
function applyRotation(
  symbol: MapLibreLayer,
  rotation: string | number | undefined,
): void {
  if (rotation === undefined) {
    return;
  }
  const radToDeg = 180 / Math.PI;
  symbol.layout = symbol.layout ?? {};
  if (typeof rotation === "number") {
    symbol.layout["icon-rotate"] = rotation * radToDeg;
  } else {
    symbol.layout["icon-rotate"] = [
      "*",
      ["to-number", ["get", rotation]],
      radToDeg,
    ];
  }
  // The angle is a geographic bearing, so it must track the map, not the screen.
  symbol.layout["icon-rotation-alignment"] = "map";
}

function buildPointLayers(
  entry: NormalizedEntry,
  vectorOptions: GeoAdminGeoJSONVectorOptions,
  ctx: BuildContext,
  idPrefix: string,
): MapLibreLayer[] {
  const layers: MapLibreLayer[] = [];

  if (vectorOptions.type === "circle") {
    const circle: MapLibreLayer = {
      id: `${idPrefix}-circle`,
      type: "circle",
      source: ctx.sourceId,
      paint: {
        "circle-radius": vectorOptions.radius,
      },
    };
    if (vectorOptions.fill?.color) {
      circle.paint!["circle-color"] = vectorOptions.fill.color;
    }
    if (vectorOptions.stroke?.color) {
      circle.paint!["circle-stroke-color"] = vectorOptions.stroke.color;
      circle.paint!["circle-stroke-width"] = vectorOptions.stroke.width ?? 1;
    }
    layers.push(applyCommon(circle, entry, ctx));
  } else if (vectorOptions.type === "icon") {
    // Icon points reference an external image; the renderer's getImage resolves the
    // icon name to the src URL.
    const symbol: MapLibreLayer = {
      id: `${idPrefix}-icon`,
      type: "symbol",
      source: ctx.sourceId,
      layout: {
        "icon-image": vectorOptions.src,
        "icon-allow-overlap": true,
      },
    };
    if (vectorOptions.scale !== undefined) {
      symbol.layout!["icon-size"] = vectorOptions.scale;
    }
    applyRotation(symbol, resolveRotation(entry, vectorOptions));
    foldLabelIntoSymbol(symbol, vectorOptions.label);
    layers.push(applyCommon(symbol, entry, ctx));
  } else if (isShapeIconType(vectorOptions.type)) {
    // Non-circle shapes: generate a canvas icon and reference it from a symbol layer.
    const radius = "radius" in vectorOptions ? vectorOptions.radius : 8;
    const spec: ShapeIconSpec = {
      name: shapeIconName({
        shape: vectorOptions.type,
        radius,
        fillColor: vectorOptions.fill?.color,
        strokeColor: vectorOptions.stroke?.color,
        strokeWidth: vectorOptions.stroke?.width,
      }),
      shape: vectorOptions.type,
      radius,
      fillColor: vectorOptions.fill?.color,
      strokeColor: vectorOptions.stroke?.color,
      strokeWidth: vectorOptions.stroke?.width,
    };
    if (!ctx.icons.some((icon) => icon.name === spec.name)) {
      ctx.icons.push(spec);
    }

    const symbol: MapLibreLayer = {
      id: `${idPrefix}-symbol`,
      type: "symbol",
      source: ctx.sourceId,
      layout: {
        "icon-image": spec.name,
        "icon-allow-overlap": true,
        "icon-rotation-alignment": "map",
      },
    };
    applyRotation(symbol, resolveRotation(entry, vectorOptions));
    foldLabelIntoSymbol(symbol, vectorOptions.label);
    layers.push(applyCommon(symbol, entry, ctx));
  } else {
    log.warn({
      title: "geoadminToMapLibreStyle",
      titleColor: LogPreDefinedColor.Orange,
      messages: ["Unsupported point vectorOptions.type", vectorOptions],
    });
  }

  return layers;
}

function foldLabelIntoSymbol(
  symbol: MapLibreLayer,
  label: GeoAdminLabel | undefined,
): void {
  if (!label) {
    return;
  }
  const { layout, paint } = textPaintAndLayout(label);
  symbol.layout = { ...symbol.layout, ...layout };
  symbol.paint = { ...symbol.paint, ...paint };
}

function buildLabelLayer(
  entry: NormalizedEntry,
  label: GeoAdminLabel,
  ctx: BuildContext,
  idPrefix: string,
): MapLibreLayer {
  const { layout, paint } = textPaintAndLayout(label);
  const symbol: MapLibreLayer = {
    id: `${idPrefix}-label`,
    type: "symbol",
    source: ctx.sourceId,
    layout,
    paint,
  };
  return applyCommon(symbol, entry, ctx);
}

// --- Public entry point -------------------------------------------------------

export function geoadminToMapLibreStyle(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  sourceId: string,
  options: GeoadminToMapLibreOptions = {},
): GeoadminToMapLibreResult {
  const icons: ShapeIconSpec[] = [];
  const ctx: BuildContext = {
    sourceId,
    baseId: sourceId,
    index: 0,
    options,
    icons,
  };

  const layers: MapLibreLayer[] = [];
  normalizeEntries(geoadmin).forEach((entry, index) => {
    ctx.index = index;
    layers.push(...buildLayersForEntry(entry, ctx));
  });

  const style: MapLibreStyle = {
    version: 8,
    sources: {
      [sourceId]: {
        type: "geojson",
        // Features are supplied by the OpenLayers VectorSource at render time; this
        // empty collection just keeps the style spec-valid.
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers,
  };

  return { style, icons };
}
