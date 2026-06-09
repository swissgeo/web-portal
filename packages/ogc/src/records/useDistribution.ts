import type { ComputedRef, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, toValue, watchEffect } from "vue";

import type { Distribution, DistributionCollection } from "@/types/Records";

export function useDistribution(
  distributionCollection: Ref<DistributionCollection | null>,
  distributionId: Ref<string | null>,
): {
  distribution: ComputedRef<Distribution>;
  layerId: ComputedRef<string>;
} {
  const distribution = computed(() => {
    return extractDistribution(
      distributionCollection.value,
      distributionId.value,
    );
  });

  // TODO not sure if this is the right one
  const layerId = computed(() => distributionCollection.value?.id || null);

  watchEffect(() =>
    log.debug({
      title: "useDistribution",
      titleColor: LogPreDefinedColor.Amber,
      messages: [
        "Extracted distribution from collection",
        toValue(distribution),
        toValue(distributionCollection),
        "with layerId",
        toValue(layerId),
      ],
    }),
  );

  return { distribution, layerId };
}

export function extractDistribution(
  collection: DistributionCollection | null,
  distributionId: string | null,
): Distribution | null {
  if (!collection || !("records" in collection) || !distributionId) {
    return null;
  }

  const records = collection.records;

  for (const distribution of records) {
    if (!distribution.properties) {
      break; // go to exception below
    }
    if (distribution.id === distributionId) {
      // we found the feature with the id that's requested, carry on
      return distribution;
    }
  }

  log.warn({
    title: "useDistribution",
    titleColor: LogPreDefinedColor.Amber,
    messages: [`Unable to find ${distributionId} in collection`, collection],
  });
  return null;
}
