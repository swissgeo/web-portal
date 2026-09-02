import type { Feature } from "ol";
import type { Geometry } from "ol/geom";

export const TITLE_KEY = "sg_title";
export const DESCRIPTION_KEY = "sg_description";

/**
 * This counter is only used to generate a default title for each feature,
 * so it is not critical that it restarts on page load.
 * (aka. this is never used to generate a unique identifier for a feature, just a default title)
 */
let counter_drawing_features = 0;

/**
 * Initializes the metadata properties of a feature with default values.
 */
export function initializeMetadataProperties(
  feature: Feature<Geometry> | null,
) {
  if (!feature) {
    return;
  }

  // The properties "name" and "description" are often used in KML files, so we use them to initialize our own metadata properties.
  // If not, then we use the default values.
  feature.setProperties({
    [TITLE_KEY]: feature.get("name") ?? `Feature ${++counter_drawing_features}`,
    [DESCRIPTION_KEY]: feature.get("description") ?? "",
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
