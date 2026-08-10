import type VectorLayer from "ol/layer/Vector";
import type VectorTileLayer from "ol/layer/VectorTile";

import log, { LogPreDefinedColor } from "@swissgeo/log";

interface RegularShapeGeometry {
  points: number;
  angle: number;
  /** Inner radius as a fraction of the outer one (OpenLayers `radius2`). */
  radius2Ratio?: number;
}

/**
 * Point shapes that MapLibre cannot render natively (it only supports circles via
 * the `circle` layer type). geoadmin's literals use these extra shapes, so we render
 * them faithfully by generating a small canvas icon per shape and drawing it through
 * a `symbol` layer (`icon-image`).
 *
 * This is the single source of truth for the shape geometry: it drives both the
 * canvas icons here and the legacy OpenLayers `RegularShape` styling in
 * `geoJsonStyleFromLiterals.ts`, so the two stay visually equivalent.
 */
export const SHAPE_GEOMETRY: Record<string, RegularShapeGeometry> = {
  square: { points: 4, angle: Math.PI / 4 },
  triangle: { points: 3, angle: 0 },
  pentagon: { points: 5, angle: 0 },
  hexagon: { points: 6, angle: 0 },
  star: { points: 5, angle: 0, radius2Ratio: 0.5 },
  cross: { points: 4, angle: 0, radius2Ratio: 0 },
};

export type ShapeIconType =
  | "circle"
  | "square"
  | "triangle"
  | "pentagon"
  | "star"
  | "cross"
  | "hexagon";

export function isShapeIconType(type: string): type is ShapeIconType {
  return type === "circle" || type in SHAPE_GEOMETRY;
}

export interface ShapeIconSpec {
  /** Deterministic name referenced by the MapLibre layer's `icon-image`. */
  name: string;
  shape: ShapeIconType;
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Builds a deterministic icon name so that two identical shapes share one generated
 * icon (and one cache entry). Rotation is intentionally NOT part of the name: it is
 * applied at render time via the layer's `icon-rotate`, not baked into the bitmap.
 */
export function shapeIconName(spec: Omit<ShapeIconSpec, "name">): string {
  const fill = spec.fillColor ?? "none";
  const stroke = spec.strokeColor ?? "none";
  const width = spec.strokeWidth ?? 0;
  return `sg-${spec.shape}-${spec.radius}-${fill}-${stroke}-${width}`;
}

/**
 * Draws a single shape icon onto a canvas. The canvas is sized to fit the shape plus
 * its stroke, and the shape is centered. Returned as an HTMLCanvasElement, which
 * `ol-mapbox-style`'s `getImage` callback accepts directly (no async load needed).
 */
export function createShapeIcon(spec: ShapeIconSpec): HTMLCanvasElement {
  const strokeWidth = spec.strokeWidth ?? 0;
  // Pad by stroke width so the outline isn't clipped; star/cross reach `radius`.
  const half = spec.radius + strokeWidth;
  const size = Math.ceil(half * 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    log.error({
      title: "createShapeIcon",
      titleColor: LogPreDefinedColor.Orange,
      messages: ["Could not get 2d canvas context for", spec.name],
    });
    return canvas;
  }

  const cx = size / 2;
  const cy = size / 2;
  const geometry = SHAPE_GEOMETRY[spec.shape];

  ctx.beginPath();
  if (!geometry) {
    ctx.arc(cx, cy, spec.radius, 0, 2 * Math.PI);
  } else {
    // RegularShape draws `points` vertices alternating outer/inner radius (radius2).
    const inner =
      geometry.radius2Ratio !== undefined
        ? spec.radius * geometry.radius2Ratio
        : undefined;
    const steps = inner !== undefined ? geometry.points * 2 : geometry.points;
    for (let i = 0; i < steps; i++) {
      const isOuter = inner === undefined || i % 2 === 0;
      const r = isOuter ? spec.radius : inner;
      // Start at the top (-PI/2) and add the shape's base angle, like OpenLayers.
      const angle = (i / steps) * 2 * Math.PI - Math.PI / 2 + geometry.angle;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  if (spec.fillColor) {
    ctx.fillStyle = spec.fillColor;
    ctx.fill();
  }
  if (spec.strokeColor && strokeWidth > 0) {
    ctx.strokeStyle = spec.strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  return canvas;
}

// Icon names are content-addressed (see shapeIconName), so identical shapes share one
// canvas across layers and across re-styles of the same layer.
const canvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Builds the `getImage` callback passed to `ol-mapbox-style`'s `stylefunction`. It
 * resolves icon names produced by the converter to generated canvases, caching each
 * canvas so repeated lookups (one per rendered feature) are cheap.
 */
export function makeGetImage(
  icons: ShapeIconSpec[],
): (
  layer: VectorLayer | VectorTileLayer,
  name: string,
) => HTMLCanvasElement | string | undefined {
  const specByName = new Map(icons.map((icon) => [icon.name, icon]));

  return (_layer: VectorLayer | VectorTileLayer, name: string) => {
    const cached = canvasCache.get(name);
    if (cached) {
      return cached;
    }
    const spec = specByName.get(name);
    if (!spec) {
      // `icon`-type points reference an external image by URL; ol-mapbox-style
      // accepts a URL string from getImage and loads it itself.
      if (/^(https?:|data:)/.test(name)) {
        return name;
      }
      return undefined;
    }
    const canvas = createShapeIcon(spec);
    canvasCache.set(name, canvas);
    return canvas;
  };
}
