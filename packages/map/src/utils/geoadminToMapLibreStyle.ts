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
 * - Draw order for POLYGON/LINE features now matches the legacy renderer. All polygon
 *   fills collapse into one `fill` layer and all strokes (polygon outlines + line
 *   geometries) into one `line` layer, with the per-value differences carried as
 *   data-driven `["match"]` / `["case"]` paint expressions. `ol-mapbox-style` assigns
 *   one z-index per MapLibre layer, so a single layer means OpenLayers draws its
 *   features in source order — exactly like the legacy `OlStyleForPropertyValue`,
 *   which drew every feature in one vector layer with no per-entry z-index. This fixes
 *   the reported ordering bug (e.g. ch.bafu.hydroweb-warnkarte_national, where the last
 *   region polygons used to paint over everything).
 * - Draw order for POINT features still groups by style entry. Point entries stay one
 *   layer each (circle / symbol), because MapLibre cannot interleave `circle` and
 *   `symbol` layer types per feature. This is the residual case flagged in review as
 *   "not such an issue for point symbols" (see e.g.
 *   ch.bafu.hydroweb-messstationen_vorhersage). Even with the polygon/line fix,
 *   MapLibre always paints all `fill` below all `line` below all `symbol`, so a source
 *   order that interleaves *across* geometry types cannot be reproduced 1:1.
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
  /**
   * Free-form metadata (mapbox spec). Used to carry things the spec can't express but
   * the OpenLayers renderer can — e.g. `ol:text-background` for a label background box
   * (see {@link applyOlTextBackground}), since neither `icon-text-fit` nor a text
   * background survives `ol-mapbox-style`.
   */
  metadata?: Record<string, unknown>;
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
  // Position of this entry in the original style, used to keep generated point-layer
  // ids stable and ordered.
  index: number;
  // The raw discriminating value: the `unique` value, or the `[min, max)` range. Used
  // to build data-driven ["match"] / ["case"] paint expressions when polygon/line
  // entries are merged into a single MapLibre layer (see buildFillLayers /
  // buildStrokeLayers).
  value?: string | number;
  range?: [number, number];
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
        index: 0,
      },
    ];
  }

  if (geoadmin.type === "unique") {
    return geoadmin.values.map((value, index) => ({
      geomType: value.geomType,
      vectorOptions: value.vectorOptions,
      minResolution: value.minResolution,
      maxResolution: value.maxResolution,
      rotation: extractRotation(value),
      index,
      value: value.value,
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
  return geoadmin.ranges.map((range, index) => ({
    geomType: range.geomType,
    vectorOptions: range.vectorOptions,
    minResolution: range.minResolution,
    maxResolution: range.maxResolution,
    rotation: extractRotation(range),
    index,
    range: range.range,
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
    // MapLibre's `text-max-width` defaults to 10 ems, so ol-mapbox-style word-wraps
    // longer labels; the legacy OpenLayers renderer never auto-wraps (it only breaks
    // on an explicit `\n`). Use a large width to disable auto-wrap and match legacy —
    // explicit `\n` in a template still breaks lines.
    "text-max-width": 100,
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

/**
 * geoadmin labels can declare a filled background box (`label.text.backgroundFill` /
 * `backgroundStroke` / `padding`), which the legacy renderer drew via OpenLayers' Text
 * style. MapLibre has no equivalent paint and `ol-mapbox-style` drops it, so we stash it
 * on the layer's `metadata` for the OpenLayers side to re-apply (see
 * {@link applyOlTextBackground}). Returns `undefined` when there is no background.
 */
function labelBackgroundMetadata(
  label: GeoAdminLabel,
): Record<string, unknown> | undefined {
  const { backgroundFill, backgroundStroke, padding } = label.text;
  if (!backgroundFill && !backgroundStroke) {
    return undefined;
  }
  return {
    "ol:text-background": {
      ...(backgroundFill ? { fill: backgroundFill.color } : {}),
      ...(backgroundStroke ? { stroke: backgroundStroke } : {}),
      padding,
    },
  };
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

// --- Merged polygon/line layers (data-driven paint) ---------------------------
//
// Polygon and line features are drawn through as few MapLibre layers as possible —
// one `fill` layer for every polygon fill, one `line` layer for every stroke (polygon
// outline + line geometry) — with the per-value differences carried in data-driven
// paint expressions. This is what makes their draw order match the legacy renderer:
// `ol-mapbox-style` sets one z-index per MapLibre layer, so features that share a
// layer are painted by OpenLayers in source order rather than grouped per style entry.

const TRANSPARENT_COLOR = "rgba(0, 0, 0, 0)";

/** A polygon/line entry's fill color, or undefined when it declares none. */
function fillColorOf(entry: NormalizedEntry): string | undefined {
  const vo = entry.vectorOptions;
  return vo && "fill" in vo ? vo.fill?.color : undefined;
}

/** A polygon/line entry's stroke color, or undefined when it declares none. */
function strokeColorOf(entry: NormalizedEntry): string | undefined {
  const vo = entry.vectorOptions;
  return vo && "stroke" in vo ? vo.stroke?.color : undefined;
}

/** A polygon/line entry's stroke width (defaulting to 1 like the legacy renderer). */
function strokeWidthOf(entry: NormalizedEntry): number | undefined {
  const vo = entry.vectorOptions;
  if (vo && "stroke" in vo && vo.stroke?.color) {
    return vo.stroke.width ?? 1;
  }
  return undefined;
}

/**
 * Builds a single data-driven paint value from a set of entries that all feed the same
 * MapLibre layer (e.g. every polygon fill). `getPaint` returns an entry's paint value,
 * or undefined to skip it.
 *
 * - `single` → the one entry's value, as a constant.
 * - `unique` → `["match", ["to-string", ["get", property]], value, paint, …, fallback]`.
 * - `range`  → `["case", ["all", [">=", …], ["<", …]], paint, …, fallback]`.
 *
 * Returns undefined when no entry contributes a value, so the caller can skip the layer.
 */
function buildDataDrivenValue<T>(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  entries: NormalizedEntry[],
  getPaint: (entry: NormalizedEntry) => T | undefined,
  fallback: T,
): T | MapLibreExpression | undefined {
  if (geoadmin.type === "single") {
    return entries.length ? getPaint(entries[0]!) : undefined;
  }

  if (geoadmin.type === "unique") {
    const arms: unknown[] = [];
    for (const entry of entries) {
      const paint = getPaint(entry);
      if (paint === undefined || entry.value === undefined) {
        continue;
      }
      arms.push(String(entry.value), paint);
    }
    if (arms.length === 0) {
      return undefined;
    }
    return [
      "match",
      ["to-string", ["get", geoadmin.property]],
      ...arms,
      fallback,
    ];
  }

  // range
  const arms: unknown[] = [];
  for (const entry of entries) {
    const paint = getPaint(entry);
    if (paint === undefined || !entry.range) {
      continue;
    }
    arms.push(
      [
        "all",
        [">=", ["to-number", ["get", geoadmin.property]], entry.range[0]],
        ["<", ["to-number", ["get", geoadmin.property]], entry.range[1]],
      ],
      paint,
    );
  }
  if (arms.length === 0) {
    return undefined;
  }
  return ["case", ...arms, fallback];
}

interface ZoomBand {
  minzoom?: number;
  maxzoom?: number;
}

/** Computes an entry's MapLibre zoom window from its resolution band (see applyCommon). */
function entryZoomBand(entry: NormalizedEntry, ctx: BuildContext): ZoomBand {
  const toZoom = ctx.options.resolutionToZoom;
  const band: ZoomBand = {};
  if (!toZoom) {
    return band;
  }
  if (entry.minResolution !== undefined && entry.minResolution > 0) {
    band.maxzoom = toZoom(entry.minResolution) + 1;
  }
  if (entry.maxResolution !== undefined && entry.maxResolution !== Infinity) {
    band.minzoom = toZoom(entry.maxResolution) + 1;
  }
  return band;
}

function bandKey(band: ZoomBand): string {
  return `${band.minzoom ?? ""}|${band.maxzoom ?? ""}`;
}

function applyZoomBand(layer: MapLibreLayer, band: ZoomBand): MapLibreLayer {
  if (band.minzoom !== undefined) {
    layer.minzoom = band.minzoom;
  }
  if (band.maxzoom !== undefined) {
    layer.maxzoom = band.maxzoom;
  }
  return layer;
}

interface BandGroup {
  band: ZoomBand;
  entries: NormalizedEntry[];
}

/**
 * Groups entries by their zoom band, preserving first-seen order. Entries in the same
 * band can share one MapLibre layer (a layer has a single zoom window); different bands
 * stay separate. Production polygon/line styles have no resolution bands, so this
 * usually yields a single group.
 */
function groupByBand(
  entries: NormalizedEntry[],
  ctx: BuildContext,
): BandGroup[] {
  const order: string[] = [];
  const groups = new Map<string, BandGroup>();
  for (const entry of entries) {
    const band = entryZoomBand(entry, ctx);
    const key = bandKey(band);
    let group = groups.get(key);
    if (!group) {
      group = { band, entries: [] };
      groups.set(key, group);
      order.push(key);
    }
    group.entries.push(entry);
  }
  return order.map((key) => groups.get(key)!);
}

/** One `fill` layer per zoom band covering all polygon entries. */
function buildFillLayers(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  polygonEntries: NormalizedEntry[],
  ctx: BuildContext,
): MapLibreLayer[] {
  const layers: MapLibreLayer[] = [];
  const groups = groupByBand(polygonEntries, ctx);
  groups.forEach((group, i) => {
    const fillColor = buildDataDrivenValue(
      geoadmin,
      group.entries,
      fillColorOf,
      TRANSPARENT_COLOR,
    );
    if (fillColor === undefined) {
      return;
    }
    const suffix = groups.length > 1 ? `-${i}` : "";
    const fill: MapLibreLayer = {
      id: `${ctx.baseId}-fill${suffix}`,
      type: "fill",
      source: ctx.sourceId,
      paint: { "fill-color": fillColor as unknown },
    };
    layers.push(applyZoomBand(fill, group.band));
  });
  return layers;
}

const GEOMETRY_IS_POLYGON: MapLibreExpression = [
  "==",
  ["geometry-type"],
  "Polygon",
];
const GEOMETRY_IS_LINE: MapLibreExpression = [
  "==",
  ["geometry-type"],
  "LineString",
];

/**
 * One `line` layer per zoom band covering every stroke — both polygon outlines and
 * line geometries. A MapLibre `line` layer applies to lines AND polygons, so when both
 * are present the paint is a `["case", ["geometry-type"] == "Polygon", …outline…,
 * …line…]`; when only one is present the layer is instead filtered by geometry type so
 * it does not accidentally stroke the other.
 */
function buildStrokeLayers(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  polygonEntries: NormalizedEntry[],
  lineEntries: NormalizedEntry[],
  ctx: BuildContext,
): MapLibreLayer[] {
  const polyStroke = polygonEntries.filter(
    (entry) => strokeColorOf(entry) !== undefined,
  );
  const lineStroke = lineEntries.filter(
    (entry) => strokeColorOf(entry) !== undefined,
  );
  if (!polyStroke.length && !lineStroke.length) {
    return [];
  }

  // Union the bands of both stroke sources, preserving first-seen order.
  const order: string[] = [];
  const byBand = new Map<
    string,
    { band: ZoomBand; poly: NormalizedEntry[]; line: NormalizedEntry[] }
  >();
  const collect = (
    entries: NormalizedEntry[],
    which: "poly" | "line",
  ): void => {
    for (const group of groupByBand(entries, ctx)) {
      const key = bandKey(group.band);
      let bucket = byBand.get(key);
      if (!bucket) {
        bucket = { band: group.band, poly: [], line: [] };
        byBand.set(key, bucket);
        order.push(key);
      }
      bucket[which] = group.entries;
    }
  };
  collect(polyStroke, "poly");
  collect(lineStroke, "line");

  const layers: MapLibreLayer[] = [];
  const multiBand = order.length > 1;
  order.forEach((key, i) => {
    const bucket = byBand.get(key)!;
    const polyColor = buildDataDrivenValue(
      geoadmin,
      bucket.poly,
      strokeColorOf,
      TRANSPARENT_COLOR,
    );
    const polyWidth = buildDataDrivenValue(
      geoadmin,
      bucket.poly,
      strokeWidthOf,
      0,
    );
    const lineColor = buildDataDrivenValue(
      geoadmin,
      bucket.line,
      strokeColorOf,
      TRANSPARENT_COLOR,
    );
    const lineWidth = buildDataDrivenValue(
      geoadmin,
      bucket.line,
      strokeWidthOf,
      0,
    );

    let color: unknown;
    let width: unknown;
    let filter: MapLibreExpression | undefined;
    if (polyColor !== undefined && lineColor !== undefined) {
      // Both geometries in this layer — branch the paint on geometry type.
      color = ["case", GEOMETRY_IS_POLYGON, polyColor, lineColor];
      width = ["case", GEOMETRY_IS_POLYGON, polyWidth ?? 0, lineWidth ?? 0];
    } else if (polyColor !== undefined) {
      color = polyColor;
      width = polyWidth ?? 1;
      filter = GEOMETRY_IS_POLYGON;
    } else if (lineColor !== undefined) {
      color = lineColor;
      width = lineWidth ?? 1;
      filter = GEOMETRY_IS_LINE;
    } else {
      return;
    }

    const suffix = multiBand ? `-${i}` : "";
    const stroke: MapLibreLayer = {
      id: `${ctx.baseId}-stroke${suffix}`,
      type: "line",
      source: ctx.sourceId,
      paint: { "line-color": color, "line-width": width },
    };
    if (filter) {
      stroke.filter = filter;
    }
    layers.push(applyZoomBand(stroke, bucket.band));
  });
  return layers;
}

/**
 * Builds the layers for a single point entry (kept one-per-entry: MapLibre cannot
 * interleave `circle` and `symbol` layer types the way the legacy renderer interleaved
 * per feature). Also emits label layers for non-point entries that carry a label.
 */
function buildPointOrLabelLayers(
  entry: NormalizedEntry,
  ctx: BuildContext,
): MapLibreLayer[] {
  const { vectorOptions, geomType } = entry;
  const idPrefix = `${ctx.baseId}-${entry.index}`;

  if (geomType === "point" && vectorOptions) {
    return buildPointLayers(entry, vectorOptions, ctx, idPrefix);
  }

  // A label on a polygon/line entry needs its own symbol layer (its fill/stroke paint
  // is already merged into the shared fill/line layers above).
  if (geomType !== "point" && vectorOptions?.label) {
    return [buildLabelLayer(entry, vectorOptions.label, ctx, idPrefix)];
  }
  return [];
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
    // A `circle` layer can't carry a `text-field`, and unlike icon/shape points
    // there's no symbol layer to fold the label into. Emit a separate symbol
    // text layer (drawn above the circle) so circle-point labels aren't dropped.
    if (vectorOptions.label) {
      layers.push(buildLabelLayer(entry, vectorOptions.label, ctx, idPrefix));
    }
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
  const background = labelBackgroundMetadata(label);
  if (background) {
    symbol.metadata = { ...symbol.metadata, ...background };
  }
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
  const background = labelBackgroundMetadata(label);
  if (background) {
    symbol.metadata = background;
  }
  return applyCommon(symbol, entry, ctx);
}

// --- Conversion notes ---------------------------------------------------------

export interface MapLibreConversionNote {
  /** What the geoadmin style declares. */
  geoadmin: string;
  /** What the converter emits in the MapLibre style for it. */
  maplibre: string;
}

/**
 * Explains, deterministically (no LLM), how a given geoadmin style is translated
 * to MapLibre. It walks the same normalized entries the converter builds from and
 * reports each construct that is actually present as a "geoadmin → MapLibre" pair,
 * deduplicated so a 30-value `unique` style does not repeat the same note 30 times.
 *
 * This mirrors {@link geoadminToMapLibreStyle}; keep the two in sync when the
 * conversion rules change.
 */
export function geoadminToMapLibreConversionNotes(
  geoadmin: GeoAdminGeoJSONStyleDefinition,
  options: GeoadminToMapLibreOptions = {},
): MapLibreConversionNote[] {
  const notes: MapLibreConversionNote[] = [];
  const seen = new Set<string>();
  const add = (geoadminText: string, maplibreText: string): void => {
    const key = `${geoadminText}→${maplibreText}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    notes.push({ geoadmin: geoadminText, maplibre: maplibreText });
  };

  // Top-level selection model.
  if (geoadmin.type === "single") {
    add(
      'type "single" — one rule for every feature',
      "a single set of MapLibre layers with no filter",
    );
  } else if (geoadmin.type === "unique") {
    add(
      `type "unique" on property "${geoadmin.property}" — ${geoadmin.values.length} discrete value(s)`,
      'one MapLibre layer per value, filtered with ["==", ["to-string", ["get", property]], value] (compared as strings)',
    );
  } else if (geoadmin.type === "range") {
    add(
      `type "range" on property "${geoadmin.property}" — ${geoadmin.ranges.length} numeric band(s)`,
      'one MapLibre layer per band, filtered with ["all", [">=", …], ["<", …]] on ["to-number", ["get", property]]',
    );
  }

  const entries = normalizeEntries(geoadmin);
  let hasResolutionBand = false;

  for (const entry of entries) {
    const { vectorOptions, geomType } = entry;

    if (geomType === "polygon") {
      if (
        vectorOptions &&
        "fill" in vectorOptions &&
        vectorOptions.fill?.color
      ) {
        add(
          "polygon fill color",
          'one shared "fill" layer for all polygons (fill-color as a data-driven match/case over the style values)',
        );
      }
      if (
        vectorOptions &&
        "stroke" in vectorOptions &&
        vectorOptions.stroke?.color
      ) {
        add(
          "polygon stroke",
          'one shared "line" layer for all strokes (line-color/line-width data-driven; polygon outlines branch on geometry-type)',
        );
      }
    } else if (geomType === "line") {
      add(
        "line geometry stroke",
        'the shared "line" layer (line-color/line-width data-driven; line geometries branch on geometry-type)',
      );
    } else if (geomType === "point" && vectorOptions) {
      if (vectorOptions.type === "circle") {
        add(
          'point "circle" (radius/fill/stroke)',
          'a "circle" layer (circle-radius, circle-color, circle-stroke-color/width)',
        );
      } else if (vectorOptions.type === "icon") {
        add(
          'point "icon" (external src image)',
          'a "symbol" layer (icon-image = src, icon-size = scale)',
        );
      } else if (isShapeIconType(vectorOptions.type)) {
        add(
          `point "${vectorOptions.type}" shape`,
          'a generated canvas icon plus a "symbol" layer referencing it (icon-image)',
        );
      }
    }

    // Labels.
    const label = vectorOptions?.label;
    if (label) {
      add(
        "label template",
        'a symbol "text-field" (${prop} → ["get", prop]; mixed templates → ["concat", …])',
      );
      if (label.text.font) {
        add(
          "label CSS font shorthand",
          '"text-size" + "text-font" parsed out of the CSS font',
        );
      }
      if (label.text.textBaseline || label.text.textAlign) {
        add(
          "label textBaseline/textAlign",
          '"text-anchor" (and "text-justify")',
        );
      }
      if (
        label.text.offsetX !== undefined ||
        label.text.offsetY !== undefined
      ) {
        add(
          "label pixel offset",
          '"text-offset" (pixels converted to ems via the font size)',
        );
      }
      if (label.text.fill?.color) {
        add("label fill color", '"text-color"');
      }
      if (label.text.stroke?.color) {
        add("label stroke", '"text-halo-color" + "text-halo-width"');
      }
    }

    // Rotation.
    const rotation = vectorOptions
      ? resolveRotation(entry, vectorOptions)
      : entry.rotation;
    if (typeof rotation === "number") {
      add(
        "static rotation (radians)",
        '"icon-rotate" in degrees, "icon-rotation-alignment": "map"',
      );
    } else if (typeof rotation === "string") {
      add(
        `data-driven rotation from property "${rotation}"`,
        '"icon-rotate" expression (radians → degrees) per feature, "icon-rotation-alignment": "map"',
      );
    }

    if (
      (entry.minResolution !== undefined && entry.minResolution > 0) ||
      (entry.maxResolution !== undefined && entry.maxResolution !== Infinity)
    ) {
      hasResolutionBand = true;
    }
  }

  if (hasResolutionBand) {
    if (options.resolutionToZoom) {
      add(
        "minResolution / maxResolution band",
        '"minzoom" / "maxzoom" (zoom is inverse to resolution; band edge shifted by +1 to match the legacy renderer)',
      );
    } else {
      add(
        "minResolution / maxResolution band",
        "not converted — no resolutionToZoom supplied, so zoom bounds are omitted",
      );
    }
  }

  // Draw-order note. Polygon/line features are merged into shared data-driven layers,
  // so they keep the legacy renderer's source-order drawing; point entries stay one
  // layer each and are grouped by entry.
  const hasPoints = entries.some((entry) => entry.geomType === "point");
  if (entries.length > 1) {
    add(
      "all entries drawn in one OpenLayers vector layer, interleaved per feature",
      "polygon/line features share one fill + one line layer, so they keep source order like the legacy renderer" +
        (hasPoints
          ? "; point entries stay one layer each, so points are still grouped by entry"
          : ""),
    );
  }

  return notes;
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
    options,
    icons,
  };

  const entries = normalizeEntries(geoadmin);
  const polygonEntries = entries.filter(
    (entry) => entry.geomType === "polygon",
  );
  const lineEntries = entries.filter((entry) => entry.geomType === "line");

  for (const entry of entries) {
    if (
      entry.vectorOptions &&
      entry.geomType !== "polygon" &&
      entry.geomType !== "line" &&
      entry.geomType !== "point"
    ) {
      log.warn({
        title: "geoadminToMapLibreStyle",
        titleColor: LogPreDefinedColor.Orange,
        messages: ["Unsupported geomType, skipping entry", entry.geomType],
      });
    }
  }

  // Order matters: MapLibre paints layers in array order. Polygon fills (bottom), then
  // all strokes (polygon outlines + lines), then point/label symbols (top). Polygon and
  // line features are merged into shared data-driven layers so OpenLayers draws them in
  // source order — matching the legacy renderer (see the file header's draw-order note).
  const layers: MapLibreLayer[] = [
    ...buildFillLayers(geoadmin, polygonEntries, ctx),
    ...buildStrokeLayers(geoadmin, polygonEntries, lineEntries, ctx),
  ];
  // Point layers (and any polygon/line labels) stay one-per-entry, in original order.
  for (const entry of entries) {
    layers.push(...buildPointOrLabelLayers(entry, ctx));
  }

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
