import type { InjectionKey } from "vue";

/**
 * What the search store needs from the app's configuration. The app provides
 * it once, e.g. in a Nuxt plugin:
 *
 * ```ts
 * nuxtApp.vueApp.provide(searchConfigKey, { ... })
 * ```
 */
export interface SearchConfig {
  /** Base URL of the location and layer feature search service */
  searchServiceUrl: string;
  /** Base URL of the OGC API, used to search layers in the catalog */
  ogcApiEndpoint: string;
  /** Catalog collection of the OGC API to search layers in */
  ogcCatalogCollection: string;
  /** Whether CMS content pages are searched too */
  enableCmsSearch: boolean;
}

export const searchConfigKey: InjectionKey<SearchConfig> = Symbol(
  "swissgeo-search-config",
);
