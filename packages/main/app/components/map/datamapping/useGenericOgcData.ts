import type { DatasetLayer } from "@swissgeo/layers";

import {
  usePreferredDistribution,
  useDistribution,
  useDistributionCollection,
  useService,
} from "@swissgeo/ogc";

import { determineFormat } from "./determineFormat";

export function useGenericOgcData(
  layer: Ref<DatasetLayer>,
  onError: (error: unknown) => void,
) {
  const dataset = computed(() => layer.value.data);

  const {
    distributionCollection,
    distributionUrl,
    onDistributionError,
    onDistributionResponse,
  } = useDistributionCollection(dataset);
  if (!distributionUrl.value) {
    throw new Error("Required distribution URL is missing");
  }
  const { preferredDistributionId } = usePreferredDistribution(dataset);

  // if there's a preferred distribution, let's get that one, otherwise the first one
  const distributionId = computed(
    () =>
      preferredDistributionId.value ??
      distributionCollection.value?.features.at(0)?.id ??
      null,
  );

  const { distribution, layerId } = useDistribution(
    distributionCollection,
    distributionId,
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
