import type { DatasetLayer } from "@swissgeo/layers";

import { useDistributionCollection, useService } from "@swissgeo/ogc";
import { useSelectedDistribution } from "~/composables/useSelectedDistribution";
import { determineFormat } from "~/utils/determineFormat";

export function useGenericOgcData(
  layer: Ref<DatasetLayer>,
  onError: (error: unknown) => void,
) {
  const dataset = computed(() => layer.value.data);

  const {
    distributionCollection,
    onDistributionError,
    onDistributionResponse,
  } = useDistributionCollection(dataset);
  const { distribution, layerId } = useSelectedDistribution(
    dataset,
    distributionCollection,
  );
  const { onServiceError, onServiceResponse, serviceData, serviceUrl } =
    useService(distribution);

  const layerFormat = computed(() => determineFormat(distribution.value));

  onDistributionError((error) =>
    onError(
      new Error("Unable to load required distribution", { cause: error }),
    ),
  );
  onServiceError((error) =>
    onError(new Error("Unable to load required OGC service", { cause: error })),
  );
  onDistributionResponse(() => {
    if (!distribution.value || !layerFormat.value || !layerId.value) {
      onError(new Error("Dataset has no usable OGC distribution"));
      return;
    }
    if (!serviceUrl.value) {
      onError(new Error("Required OGC service URL is missing"));
    }
  });
  onServiceResponse(() => {
    if (!serviceData.value) {
      onError(new Error("Required OGC service result is unusable"));
    }
  });

  return {
    distributionCollection,
    distribution,
    serviceData,
    layerFormat,
    layerId,
  };
}
