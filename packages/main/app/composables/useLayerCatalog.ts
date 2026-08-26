import type { Catalog } from "~/types/layerCatalog";

/**
 * The layer catalog for the active locale, fetched from
 * `/api/wpa/v1/layers/catalog` rather than bundled: bundling would ship every
 * locale's catalog to every visitor, who only ever sees one of them.
 *
 * The request repeats when the locale changes, and is shared between callers —
 * `useFetch` keys it on the URL and its query. Locales the catalog has not been
 * translated into are served the English one.
 */
export function useLayerCatalog() {
  const { locale } = useI18n();

  const { data: catalog, status } = useFetch<Catalog>(
    "/api/wpa/v1/layers/catalog",
    {
      query: { lang: locale },
      // So that consumers can render a tree unconditionally, rather than
      // guarding every use against the null `useFetch` starts out with.
      default: (): Catalog => [],
    },
  );

  return { catalog, status };
}
