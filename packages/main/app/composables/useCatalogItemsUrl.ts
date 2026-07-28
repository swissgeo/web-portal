import { buildCatalogItemsUrl } from "@swissgeo/ogc";

/**
 * Returns a builder for the OGC API Records catalog `/items` URL, reading the
 * endpoint and collection from runtime config. Pass a record id to target a
 * single item.
 */
export function useCatalogItemsUrl() {
  const runtimeConfig = useRuntimeConfig();
  return (id?: string) =>
    buildCatalogItemsUrl(
      runtimeConfig.public.ogcApiEndpoint,
      runtimeConfig.public.ogcCatalogCollection,
      id,
    );
}
