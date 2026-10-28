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

  const layerId = computed(() => {
    const externalId = distribution.value?.properties.externalIds?.[0];
    if (externalId) {
      return externalId;
    }
    return extractLayerIdFromDistributionId(distribution.value?.id);
  });

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

/**
 * Fallback for records without `externalIds`:
 * the distribution id follows the `<layerId>:<protocol>` scheme, so the layer
 * id is everything before the last colon.
 */
function extractLayerIdFromDistributionId(
  id: string | undefined,
): string | null {
  if (!id) {
    return null;
  }
  const separator = id.lastIndexOf(":");
  if (separator <= 0) {
    return null;
  }
  return id.slice(0, separator);
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
