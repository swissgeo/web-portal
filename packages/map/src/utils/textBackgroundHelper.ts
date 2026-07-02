import type { FeatureLike } from "ol/Feature";
import type VectorLayer from "ol/layer/Vector";

import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import type { MapLibreStyle } from "@/utils/geoadminToMapLibreStyle";

/**
 * Label-background config carried on a MapLibre symbol layer's `metadata` under the
 * `ol:text-background` key (emitted by {@link geoadminToMapLibreStyle} from geoadmin's
 * `label.text.backgroundFill`/`backgroundStroke`/`padding`).
 */
interface OlTextBackground {
  /** Background fill colour (any CSS colour, e.g. `rgba(14,80,114,0.9)`). */
  fill?: string;
  /** Optional background border. */
  stroke?: { color: string; width: number };
  /** `[top, right, bottom, left]` in px. */
  padding?: [number, number, number, number];
}

/**
 * Gives labels a filled background box on the OpenLayers side.
 *
 * `ol-mapbox-style` maps neither `icon-text-fit` nor any text-background property, so a
 * label box cannot come from the MapLibre style itself. OpenLayers' own `Text` style
 * does support it natively (`backgroundFill`/`backgroundStroke`/`padding`, auto-fitted to
 * the text), so this runs **after** `stylefunction(olLayer, glStyle, …)`: it wraps the
 * layer's style function and applies the box to every text style, reading the colour /
 * padding from the symbol layers' `metadata["ol:text-background"]`.
 *
 * Call it right after `stylefunction(...)` (re-run it whenever the style is re-applied).
 *
 * POC limitation: `stylefunction` evaluates all style layers through this one
 * `VectorLayer`, so a per-style-entry text style can't be traced back to its source
 * layer. Geoadmin label backgrounds are a single uniform colour across all ~60 styles,
 * so the first declared config is applied to every label.
 */
export function applyOlTextBackground(
  olLayer: VectorLayer,
  glStyle: MapLibreStyle,
): void {
  const configs = (glStyle.layers ?? [])
    .map(
      (layer) =>
        layer.metadata?.["ol:text-background"] as OlTextBackground | undefined,
    )
    .filter((cfg): cfg is OlTextBackground => Boolean(cfg));
  if (configs.length === 0) {
    return;
  }
  const cfg = configs[0];

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
      if (cfg.fill) {
        text.setBackgroundFill(new Fill({ color: cfg.fill }));
      }
      if (cfg.stroke) {
        text.setBackgroundStroke(new Stroke(cfg.stroke));
      }
      if (cfg.padding) {
        text.setPadding(cfg.padding);
      }
    }
    return styles;
  });
}
