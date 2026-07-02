import type { DatasetLayer } from "@swissgeo/layers";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import {
  usePreferredDistribution,
  useDistribution,
  useDistributionCollection,
  useService,
} from "@swissgeo/ogc";

import { determineFormat } from "./determineFormat";

export function useGenericOgcData(layer: Ref<DatasetLayer>) {
  const toaster = useToaster();
  const { $i18n } = useNuxtApp();

  const dataset = computed(() => layer.value.data);

  const { distributionCollection, error: useDistributionCollectionError } =
    useDistributionCollection(dataset);
  const { preferredDistributionId } = usePreferredDistribution(dataset);

  // if there's a preferred distribution, let's get that one, otherwise the first one
  const distributionId = computed(() => {
    if (!distributionCollection.value?.features?.length) {
      // If any of these is null-ish, then there's no point in returning the preferredDistributionId
      return null;
    }
    return (
      preferredDistributionId.value ??
      distributionCollection.value.features[0]!.id
    );
  });

  const { distribution, layerId } = useDistribution(
    distributionCollection,
    distributionId,
  );
  const { serviceData, error: useServiceError } = useService(distribution);

  const layerFormat = computed(() => determineFormat(distribution.value));

  watch([useDistributionCollectionError, useServiceError], (values) => {
    toaster.showError(
      $i18n.t("map.addToMapError", {
        layerId: layer.value.humanId,
      }),
    );

    log.error({
      title: `Failed to add layer ${layer.value.humanId} to map`,
      titleColor: LogPreDefinedColor.Red,
      messages: [
        layer.value.humanId,
        ...values.filter((value) => !!value).map((value) => value.toString()),
      ],
    });
  });

  return {
    distributionCollection,
    distribution,
    serviceData,
    layerFormat,
    layerId,
  };
}
