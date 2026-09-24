/**
 * Convert a hex color string to an RGB tuple.
 */
export function hexColorToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

/**
 * Convert an OL RGBA color array [r, g, b, a] to a hex string #RRGGBB.
 * Alpha is dropped — the app manages opacity separately at render time.
 */
export function rgbaToHex(color: number[]): string {
  if (!color || !Array.isArray(color) || color.length < 3) {
    return "#000000"; // Default to black if the color array is invalid
  }
  const r = Math.round(color[0]);
  const g = Math.round(color[1]);
  const b = Math.round(color[2]);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
