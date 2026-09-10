import type { Dataset, DatasetCollection } from "@swissgeo/ogc";

/**
 * Builds the Lucene `q` filter restricting the catalog to the given record ids,
 * e.g. `id:("ch.blw.erosion" OR "ch.bfe.fernwaerme-angebot")`.
 */
function buildIdsQuery(layerIds: string[]): string {
  const terms = layerIds
    .map((layerId) => `"${layerId.replace(/(["\\])/g, "\\$1")}"`)
    .join(" OR ");
  return `id:(${terms})`;
}

/**
 * Where a layer's catalog record stands, using the same statuses as Nuxt's
 * `AsyncDataRequestStatus`: `idle` means `loadRecords()` has not been called
 * yet.
 */
export type LayerRecordState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; dataset: Dataset }
  | { status: "error" };

export type LayerRecord = {
  layerId: string;
  state: Ref<LayerRecordState>;
};

/**
 * Resolves catalog records for layer ids, which hold both the title to show and
 * the dataset a layer is made from. Requests are aborted when the calling scope
 * is disposed, so records arriving late never touch a torn-down component.
 */
export function useLayerRecords() {
  const catalogItemsUrl = useCatalogItemsUrl();
  const { locale } = useI18n();

  const recordFetchController = new AbortController();
  onScopeDispose(() => recordFetchController.abort());

  async function fetchRecordsById(
    layerIds: string[],
    language: string,
    signal: AbortSignal,
  ): Promise<Dataset[]> {
    const collection = await $fetch<DatasetCollection>(catalogItemsUrl(), {
      query: {
        lang: language,
        limit: layerIds.length,
        q: buildIdsQuery(layerIds),
      },
      signal,
    });
    return collection.features;
  }

  /**
   * Prepares the record of a single layer. Nothing is fetched until the layer is
   * handed to `loadRecords()`.
   */
  function layerRecord(layerId: string): LayerRecord {
    return { layerId, state: ref<LayerRecordState>({ status: "idle" }) };
  }

  /**
   * Fetches the given records in a single request. Records that are already
   * loading, loaded or failed are left alone, so handing the same layers over
   * again fetches nothing.
   */
  function loadRecords(records: LayerRecord[]): void {
    const idleRecords = records.filter(
      (record) => record.state.value.status === "idle",
    );
    if (idleRecords.length === 0) {
      return;
    }

    for (const { state } of idleRecords) {
      state.value = { status: "pending" };
    }

    fetchRecordsById(
      idleRecords.map(({ layerId }) => layerId),
      locale.value,
      recordFetchController.signal,
    )
      .then((datasets) => {
        // The response is neither ordered nor guaranteed to hold every id that
        // was asked for, so datasets are paired back up by their record id.
        const datasetsById = new Map(
          datasets.map((dataset) => [dataset.id, dataset]),
        );
        for (const { layerId, state } of idleRecords) {
          const dataset = datasetsById.get(layerId);
          state.value = dataset
            ? { status: "success", dataset }
            : { status: "error" };
        }
      })
      .catch(() => {
        if (!recordFetchController.signal.aborted) {
          for (const { state } of idleRecords) {
            state.value = { status: "error" };
          }
        }
      });
  }

  return { layerRecord, loadRecords };
}
