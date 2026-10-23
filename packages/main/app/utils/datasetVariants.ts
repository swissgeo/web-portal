import type {
  Dataset,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";

/** Data layer and availability map of an aggregated dataset, else none. */
export function getDatasetVariants(
  dataset: Pick<Dataset, "properties"> | null,
  collection: DistributionCollection | null,
): Distribution[] {
  if (!dataset?.properties.aggregated || !collection) {
    return [];
  }
  const { features } = collection;
  const dataLayer = features.find(
    (distribution) =>
      distribution.id === dataset.properties.preferredDistributionId,
  );
  const availabilityMap = features.find(
    (distribution) => distribution.properties.metaInformation === true,
  );
  if (!dataLayer || !availabilityMap) {
    return [];
  }
  return [dataLayer, availabilityMap];
}
