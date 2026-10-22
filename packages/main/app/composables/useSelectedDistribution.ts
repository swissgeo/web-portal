import type { Dataset, DistributionCollection } from "@swissgeo/ogc";
import type { MaybeRefOrGetter, Ref } from "vue";

import { useDistribution, usePreferredDistribution } from "@swissgeo/ogc";
import { getDatasetVariants } from "~/utils/datasetVariants";
import { computed, toValue } from "vue";

export function useSelectedDistribution(
  dataset: Ref<Pick<Dataset, "properties"> | null>,
  collection: Ref<DistributionCollection | null>,
  selectedDistributionId?: MaybeRefOrGetter<string | undefined>,
) {
  const { preferredDistributionId } = usePreferredDistribution(dataset);
  const distributionId = computed(() => {
    // A selected id that is not a variant (e.g. from an old or edited link)
    // falls back to the preferred distribution.
    const selectedId = toValue(selectedDistributionId);
    const isVariant = getDatasetVariants(dataset.value, collection.value).some(
      (variant) => variant.id === selectedId,
    );
    if (selectedId && isVariant) {
      return selectedId;
    }
    return (
      preferredDistributionId.value ??
      collection.value?.features.at(0)?.id ??
      null
    );
  });

  return useDistribution(collection, distributionId);
}
