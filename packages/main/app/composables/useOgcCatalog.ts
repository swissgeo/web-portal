import type { DatasetCollection } from "@swissgeo/ogc";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";

export function useOgcCatalog(language: Ref<string>) {
  const catalogItemsUrl = useCatalogItemsUrl();

  log.debug({
    title: "useOgcDatasetCollection",
    titleColor: LogPreDefinedColor.Yellow,
    messages: ["loading the catalog with language", language.value],
  });

  const catalogLink = computed(() => catalogItemsUrl());

  const { data: recordData } = useFetch<DatasetCollection>(catalogLink.value, {
    query: {
      language: language.value,
      limit: 2000,
    },
  });

  return {
    data: recordData,
  };
}
