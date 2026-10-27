import type VectorLayer from "ol/layer/Vector";
import type VectorTileLayer from "ol/layer/VectorTile";

import log, { LogPreDefinedColor } from "@swissgeo/log";

/**
 * Point shapes that MapLibre cannot render natively (it only supports circles via
 * the `circle` layer type). The SGDI-hosted styles carry specs for these extra
 * shapes in the `icons` array of the style payload; each spec's `name` is
 * referenced by the style layers' `icon-image`. We rasterize each shape to a
 * small canvas so `ol-mapbox-style` can draw it through a `symbol` layer.
 *
 * The geometry mirrors OpenLayers' `RegularShape` (points count, angles,
 * `radius2` for star/cross) so the output stays visually equivalent to the
 * legacy OpenLayers styling of the same shapes.
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
 * Draws a single shape icon onto a canvas. The canvas is sized to fit the shape
 * plus its stroke, and the shape is centered. Returned as an `HTMLCanvasElement`,
 * which `ol-mapbox-style`'s `getImage` callback accepts directly
 */
export function createShapeIcon(spec: ShapeIconSpec): HTMLCanvasElement {
  const strokeWidth = spec.strokeWidth ?? 0;
  // Pad by stroke width so the outline isn't clipped; star/cross reach `radius`.
  const half = spec.radius + strokeWidth;
  const size = Math.ceil(half * 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    log.error({
      title: "createShapeIcon",
      titleColor: LogPreDefinedColor.Orange,
      messages: ["Could not get 2d canvas context for", spec.name],
    });
    return canvas;
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const geometry = geometryForShape(spec.shape, spec.radius);

  context.beginPath();
  if (spec.shape === "circle" || !geometry) {
    context.arc(centerX, centerY, spec.radius, 0, 2 * Math.PI);
  } else {
    // RegularShape draws `points` vertices alternating outer/inner radius (radius2).
    const hasInner = geometry.radius2 !== undefined;
    const steps = hasInner ? geometry.points * 2 : geometry.points;
    for (let i = 0; i < steps; i++) {
      const isOuter = !hasInner || i % 2 === 0;
      const r = isOuter ? spec.radius : (geometry.radius2 ?? spec.radius);
      // Start at the top (-PI/2) and add the shape's base angle, like OpenLayers.
      const angle = (i / steps) * 2 * Math.PI - Math.PI / 2 + geometry.angle;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
  }

  if (spec.fillColor) {
    context.fillStyle = spec.fillColor;
    context.fill();
  }
  if (spec.strokeColor && strokeWidth > 0) {
    context.strokeStyle = spec.strokeColor;
    context.lineWidth = strokeWidth;
    context.stroke();
  }

  return canvas;
}

/**
 * Builds the `getImage` callback passed to `ol-mapbox-style`'s `stylefunction`.
 * It resolves the icon names referenced by a hosted style to generated canvases,
 * caching each canvas so repeated lookups (one per rendered feature) are cheap.
 * Names that are URLs (external icons, e.g. geoadmin point icons) are returned
 * as-is so `ol-mapbox-style` loads them itself.
 */
export function createGetImageCallback(
  icons: ShapeIconSpec[],
): (
  layer: VectorLayer | VectorTileLayer,
  name: string,
) => HTMLCanvasElement | string | undefined {
  const iconSpecsByName = new Map(icons.map((icon) => [icon.name, icon]));
  const cache = new Map<string, HTMLCanvasElement>();

  return (_layer: VectorLayer | VectorTileLayer, name: string) => {
    const cached = cache.get(name);
    if (cached) {
      return cached;
    }
    const iconSpec = iconSpecsByName.get(name);
    if (!iconSpec) {
      if (/^(https?:|data:)/.test(name)) {
        return name;
      }
      return undefined;
    }
    const canvas = createShapeIcon(iconSpec);
    cache.set(name, canvas);
    return canvas;
  };
}
