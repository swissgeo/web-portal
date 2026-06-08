import type VectorLayer from "ol/layer/Vector";
import type VectorTileLayer from "ol/layer/VectorTile";

import log, { LogPreDefinedColor } from "@swissgeo/log";

/**
 * Point shapes that MapLibre cannot render natively (it only supports circles via
 * the `circle` layer type). geoadmin's literals use these extra shapes, so we render
 * them faithfully by generating a small canvas icon per shape and drawing it through
 * a `symbol` layer (`icon-image`).
 *
 * The geometry below mirrors {@link getOlImageStyleForShape} in
 * `geoJsonStyleFromLiterals.ts` (points count, angles, `radius2` for star/cross) so
 * the output stays visually equivalent to the legacy OpenLayers styling.
 */
export type ShapeIconType =
  | "circle"
  | "square"
  | "triangle"
  | "pentagon"
  | "star"
  | "cross"
  | "hexagon";

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

interface RegularShapeGeometry {
  points: number;
  angle: number;
  /** Inner radius for star/cross (as in OpenLayers `RegularShape`). */
  radius2?: number;
}

function geometryForShape(
  shape: ShapeIconType,
  radius: number,
): RegularShapeGeometry | undefined {
  switch (shape) {
    case "square":
      return { points: 4, angle: Math.PI / 4 };
    case "triangle":
      return { points: 3, angle: 0 };
    case "pentagon":
      return { points: 5, angle: 0 };
    case "hexagon":
      return { points: 6, angle: 0 };
    case "star":
      return { points: 5, angle: 0, radius2: radius / 2 };
    case "cross":
      return { points: 4, angle: 0, radius2: 0 };
    case "circle":
      return undefined;
  }
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
  const geometry = geometryForShape(spec.shape, spec.radius);

  ctx.beginPath();
  if (spec.shape === "circle" || !geometry) {
    ctx.arc(cx, cy, spec.radius, 0, 2 * Math.PI);
  } else {
    // RegularShape draws `points` vertices alternating outer/inner radius (radius2).
    const hasInner = geometry.radius2 !== undefined;
    const steps = hasInner ? geometry.points * 2 : geometry.points;
    for (let i = 0; i < steps; i++) {
      const isOuter = !hasInner || i % 2 === 0;
      const r = isOuter ? spec.radius : (geometry.radius2 ?? spec.radius);
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
) => HTMLCanvasElement | undefined {
  const specByName = new Map(icons.map((icon) => [icon.name, icon]));
  const cache = new Map<string, HTMLCanvasElement>();

  return (_layer: VectorLayer | VectorTileLayer, name: string) => {
    const cached = cache.get(name);
    if (cached) {
      return cached;
    }
    const spec = specByName.get(name);
    if (!spec) {
      return undefined;
    }
    const canvas = createShapeIcon(spec);
    cache.set(name, canvas);
    return canvas;
  };
}
