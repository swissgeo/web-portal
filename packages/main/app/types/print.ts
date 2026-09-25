export const printFormats = ["a3", "a4", "a5"] as const;
export type PrintFormat = (typeof printFormats)[number];
export const printOrientations = ["landscape", "portrait"] as const;
export type PrintOrientation = (typeof printOrientations)[number];

export const printModes = ["wysiwyg", "fixed-scale"] as const;
export type PrintMode = (typeof printModes)[number];

/**
 * Scales offered in fixed-scale mode (1:25'000 => 25000), and the tile level of the swisstopo
 * pyramid that the map layers request for that scale.
 *
 * Where the values come from:
 * - `level`: the "Zoom Level" of the table at
 *   https://docs.geo.admin.ch/visualize-data/wmts.html#gettile (the number in the tile URL, not the
 *   column "Map zoom"). Its resolution is the index in `constants.SWISSTOPO_TILEGRID_RESOLUTIONS`,
 *   e.g. level 22 is 2.5 m/px.
 * - The pairing of a scale with a level is the one of the print of map.geo.admin.ch (MapFish Print 3),
 *   which can be recomputed by hand:
 *   1. That print runs at 254 dpi (our print at 96 dpi does not matter for this table):
 *      https://github.com/geoadmin/service-print3/blob/970d78a1d7d35deaafc0b388954a173261f98707/print-apps/mapviewer/config.yaml#L28-L29
 *   2. Its scales, from which ours are selected:
 *      https://github.com/geoadmin/service-print3/blob/970d78a1d7d35deaafc0b388954a173261f98707/print-apps/mapviewer/config.yaml#L33
 *   3. The resolution of a scale on the paper is scale * 0.0254 / dpi metres per pixel, so
 *      scale / 10'000 at 254 dpi: 1:25'000 is 2.5 m/px, 1:100'000 is 10 m/px, 1:1'000'000 is 100 m/px.
 *   4. MapFish Print requests the tile level whose resolution is closest to that:
 *      https://github.com/mapfish/mapfish-print/blob/880904d622bb6593dcd5979a3c9315bb2fcde15d/core/src/main/java/org/mapfish/print/map/tiled/wmts/WMTSLayer.java#L84-L112
 *   5. The level with that resolution is read in the table of the docs above: 1 m is level 25,
 *      2.5 m is 22, 5 m is 21, 10 m is 20, 20 m is 19, 50 m is 18, 100 m is 17.
 * - `scale`: our selection from the list of step 2.
 */
export const printFixedScales: readonly { scale: number; level: number }[] = [
  { scale: 10000, level: 25 },
  { scale: 25000, level: 22 },
  { scale: 50000, level: 21 },
  { scale: 100000, level: 20 },
  { scale: 200000, level: 19 },
  { scale: 500000, level: 18 },
  { scale: 1000000, level: 17 },
];

export const PRINT_DPI = 96;

export interface PrintConfig {
  /**
   * Format of the print output
   */
  format: PrintFormat;
  /**
   * Resolution of the print in dip per inch, DPI (eg. 96)
   */
  resolution: number;
  /**
   * Orientation of the print, landscape being horizonal, portrait being vertical
   */
  orientation: PrintOrientation;
  /**
   * Scale denominator (eg. 25000 for 1:25'000). When set, the map is drawn at the exact
   * resolution of this scale (at `resolution` DPI) instead of the zoom level of the state.
   */
  scale?: number;
}
