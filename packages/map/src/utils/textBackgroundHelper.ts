import type { FeatureLike } from "ol/Feature";
import type VectorLayer from "ol/layer/Vector";

import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import type { MapLibreStyleDocument } from "@/types";

/**
 * Label-background config carried on a MapLibre symbol layer's `metadata` under
 * the `ol:text-background` key
 */
interface OlTextBackground {
  fill?: string;
  stroke?: { color: string; width: number };
  /** `[top, right, bottom, left]` in px. */
  padding?: [number, number, number, number];
}

/**
 * Gives labels a filled background box on the OpenLayers side.
 *
 * the standard style itself doesn't have a properties to set a text background, so
 * a label box is not natively doable.
 *
 * Openlayers has native support, which will run after the rest of the style function
 * applied, and the parameters for it are given through the style metadata in the
 * `ol:text-background` field.
 *
 *
 * Limitation: `stylefunction` evaluates all style layers through this one
 * `VectorLayer`, so a per-style-entry text style can't be traced back to its
 * source layer. GeoJSON label backgrounds are a single uniform colour across
 * the hosted styles, so the first declared config is applied to every label.
 */
export function applyOlTextBackground(
  olLayer: VectorLayer,
  glStyle: MapLibreStyleDocument,
): void {
  const configs = (glStyle.layers ?? [])
    .map(
      (layer) =>
        (layer.metadata as Record<string, unknown> | undefined)?.[
          "ol:text-background"
        ] as OlTextBackground | undefined,
    )
    .filter((config): config is OlTextBackground => Boolean(config));
  if (configs.length === 0) {
    return;
  }
  const config = configs[0];
  if (!config) {
    return;
  }

  const base = olLayer.getStyleFunction();
  if (!base) {
    return;
  }
  olLayer.setStyle((feature: FeatureLike, resolution: number) => {
    const styles = base(feature, resolution);
    const arr = Array.isArray(styles) ? styles : styles ? [styles] : [];
    for (const style of arr) {
      const text = style.getText();
      if (!text) {
        continue;
      }
      if (config.fill) {
        text.setBackgroundFill(new Fill({ color: config.fill }));
      }
      if (config.stroke) {
        text.setBackgroundStroke(new Stroke(config.stroke));
      }
      if (config.padding) {
        text.setPadding(config.padding);
      }
    }
    return styles;
  });
}
