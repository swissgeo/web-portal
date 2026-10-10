export const printFormats = ["a3", "a4", "a5"] as const;
export type PrintFormat = (typeof printFormats)[number];
export const printOrientations = ["landscape", "portrait"] as const;
export type PrintOrientation = (typeof printOrientations)[number];

export const printModes = ["wysiwyg", "fixed-scale"] as const;
export type PrintMode = (typeof printModes)[number];

/** Scales offered in fixed-scale mode (1:25'000 => 25000) */
export const printFixedScales: readonly [number, ...number[]] = [
  10000, 25000, 50000, 100000, 200000, 500000, 1000000,
];

/**
 * DPI at which one tile pixel is 0.1 mm on paper. At a fixed scale, tiled layers request the tile
 * level whose resolution is the scale at this DPI: scale / 10'000 m/px, e.g. 2.5 m/px (level 22)
 * for 1:25'000. The resolutions of the levels: https://docs.geo.admin.ch/visualize-data/wmts.html#gettile
 */
export const TILE_DPI = 254;

export const PRINT_DPI = 192;

export interface PrintConfig {
  /**
   * Format of the print output
   */
  format: PrintFormat;
  /**
   * Resolution of the print in dip per inch, DPI (eg. 192)
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
