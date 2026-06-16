import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, toValue, watchEffect } from "vue";

import type { Distribution, DistributionCollection } from "@/types/Records";

export function useDistribution(
  distributionCollection: Ref<DistributionCollection | null>,
  distributionId: Ref<string | null>,
) {
  const distribution = computed(() => {
    return extractDistribution(
      distributionCollection.value,
      distributionId.value,
    );
  });

  const layerId = computed(
    () => distribution.value?.properties.externalIds?.[0] || null,
  );

  watchEffect(() =>
    log.debug({
      title: "useDistribution",
      titleColor: LogPreDefinedColor.Amber,
      messages: [
        "Extracted <1> distribution from collection <2> with layerId <3>",
        toValue(distribution),
        toValue(distributionCollection),
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
  if (!collection || !("features" in collection) || !distributionId) {
    return null;
  }

  const features = collection.features;

  for (const distribution of features) {
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
