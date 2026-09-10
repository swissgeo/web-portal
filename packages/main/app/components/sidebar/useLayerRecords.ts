import type { Dataset, DatasetCollection } from "@swissgeo/ogc";

export function useLayerRecords() {
  const catalogItemsUrl = useCatalogItemsUrl();
  const { locale } = useI18n();

  async function fetchRecords(
    layerIds: string[],
    language: string,
  ): Promise<Dataset[]> {
    const collection = await $fetch<DatasetCollection>(catalogItemsUrl(), {
      query: {
        lang: language,
        limit: layerIds.length,
      },
    });
    return collection.features;
  }

  return { fetchRecords };
}
