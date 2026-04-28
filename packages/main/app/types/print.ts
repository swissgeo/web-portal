export const printFormats = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'] as const
export type PrintFormat = typeof printFormats[number];
export const printOrientations = ['landscape', 'portrait'] as const
export type PrintOrientation = typeof printOrientations[number]

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
   * Zoom enforced for the print. Should overwrite the zoom level from state
   */
  zoom: number;
}
