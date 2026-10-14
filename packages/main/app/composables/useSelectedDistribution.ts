import type { Dataset, DistributionCollection } from "@swissgeo/ogc";
import type { Ref } from "vue";

import { useDistribution, usePreferredDistribution } from "@swissgeo/ogc";
import { computed } from "vue";

export function useSelectedDistribution(
  dataset: Ref<Pick<Dataset, "properties"> | null>,
  collection: Ref<DistributionCollection | null>,
) {
  const { preferredDistributionId } = usePreferredDistribution(dataset);
  const distributionId = computed(
    () =>
      preferredDistributionId.value ??
      collection.value?.features.at(0)?.id ??
      null,
  );

  return useDistribution(collection, distributionId);
}
