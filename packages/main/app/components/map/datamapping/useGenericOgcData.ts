import type { DatasetLayer } from "@swissgeo/layers";

import {
  usePreferredDistribution,
  useDistribution,
  useDistributionCollection,
  useService,
} from "@swissgeo/ogc";

import { determineFormat } from "./determineFormat";

export function useGenericOgcData(layer: Ref<DatasetLayer>) {
  const dataset = computed(() => layer.value.data);

  const { distributionCollection } = useDistributionCollection(dataset);
  const { preferredDistributionId } = usePreferredDistribution(dataset);

  // if there's a preferred distribution, let's get that one, otherwise the first one
  const distributionId = computed(() => {
    if (!distributionCollection.value?.records?.length) {
      // If any of these is null-ish, then there's no point in returning the preferredDistributionId
      return null;
    }
    return (
      preferredDistributionId.value ??
      distributionCollection.value.records[0]!.id
    );
  });

  const { distribution, layerId } = useDistribution(
    distributionCollection,
    distributionId,
  );
  const { serviceData } = useService(distribution);

  const layerFormat = computed(() => determineFormat(distribution.value));

  return {
    distributionCollection,
    distribution,
    serviceData,
    layerFormat,
    layerId,
  };
}
