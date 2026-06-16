import type { DatasetCollection } from "@swissgeo/ogc";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";

export function useOgcCatalog(language: Ref<string>) {
  const runtimeConfig = useRuntimeConfig();

  log.debug({
    title: "useOgcDatasetCollection",
    titleColor: LogPreDefinedColor.Yellow,
    messages: ["loading the catalog with language", language.value],
  });

  const catalogLink = computed(() =>
    joinURL(
      runtimeConfig.public.ogcApiEndpoint,
      "/collections/",
      runtimeConfig.public.ogcCatalogCollection,
      "/items",
    ),
  );

  const { data: recordData } = useFetch<DatasetCollection>(catalogLink.value, {
    query: {
      language: language.value,
    },
  });

  return {
    data: recordData,
  };
}
