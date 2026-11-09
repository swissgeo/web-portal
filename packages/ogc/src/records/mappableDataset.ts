/**
 * Tells if the map can show the dataset.
 *
 * The catalog sets `preferredDistributionId` only when the dataset has a
 * distribution that the map can show (WMS, WMTS or GeoJSON). A dataset with
 * only a STAC distribution, or with no distribution, does not have it. Thus
 * the catalog and the search can decide without a request for the
 * distributions.
 */
export function isMappableDataset(dataset: {
  properties?: { preferredDistributionId?: string };
}): boolean {
  return Boolean(dataset.properties?.preferredDistributionId);
}
