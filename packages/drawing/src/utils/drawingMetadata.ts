import type { Feature } from "ol";
import type { Geometry } from "ol/geom";

export const TITLE_KEY = "title";
export const DESCRIPTION_KEY = "description";

let counter_drawing_features = 0;

/**
 * Initializes the metadata properties of a feature with default values.
 */
export function initializeMetadataProperties(feature: Feature<Geometry>) {
  feature.setProperties({
    [TITLE_KEY]: `Feature ${++counter_drawing_features}`,
    [DESCRIPTION_KEY]: "",
  });
}

/**
 * Sets the title of a feature.
 */
export function setFeatureTitle(feature: Feature<Geometry>, title: string) {
  if (!feature) {
    return;
  }
  feature.set(TITLE_KEY, title);
}

/**
 * Get the title of a feature.
 */
export function getFeatureTitle(feature: Feature<Geometry>): string {
  return feature?.get(TITLE_KEY) ?? "";
}

/**
 * Get the description of a feature.
 */
export function getFeatureDescription(feature: Feature<Geometry>): string {
  return feature?.get(DESCRIPTION_KEY) ?? "";
}

/**
 * Set the description of a feature.
 */
export function setFeatureDescription(
  feature: Feature<Geometry>,
  description: string,
) {
  if (!feature) {
    return;
  }
  feature.set(DESCRIPTION_KEY, description);
}
