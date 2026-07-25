const trimSlashes = (segment: string): string =>
  segment.replace(/^\/+|\/+$/g, "");

/**
 * Build the OGC API Records `/items` URL for the catalog, optionally targeting a
 * single record by id.
 *
 * @param endpoint - OGC API base endpoint (e.g. `.../api/oar/rc1`)
 * @param collection - Catalog collection id (e.g. `swissgeo-catalog`)
 * @param id - Optional record id to target `/items/{id}`
 */
export function buildCatalogItemsUrl(
  endpoint: string,
  collection: string,
  id?: string,
): string {
  const parts = [trimSlashes(endpoint), "collections", trimSlashes(collection), "items"];
  if (id) {
    parts.push(trimSlashes(id));
  }
  return parts.join("/");
}
