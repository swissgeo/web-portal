import type { LinearRing } from "ol/geom";

/**
 * Get the length of a LinearRing geometry in map units.
 * This is asumed that the projection uses metric units, as the drawing module is designed for Swiss projections which are metric.
 */
export function getLinearRingLength(linearRing: LinearRing): number {
  let length = 0;
  const lrCoordinates = linearRing.getCoordinates();
  for (let i = 0; i < lrCoordinates.length - 1; i++) {
    const start = lrCoordinates[i];
    const end = lrCoordinates[i + 1];

    length += Math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2);
  }
  return length;
}
