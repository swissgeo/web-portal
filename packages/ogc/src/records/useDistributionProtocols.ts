import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Distribution, DistributionCollection } from "@/types/Records";

export function useDistributionProtocols(
  distributionCollection: Ref<DistributionCollection>,
) {
  const availableProtocols = computed(() =>
    extractProtocols(distributionCollection.value),
  );

  watchEffect(() => {
    log.debug({
      title: "useDistributionProtocol",
      titleColor: LogPreDefinedColor.Yellow,
      messages: [
        "Found protocols in the distribution",
        distributionCollection,
        availableProtocols,
      ],
    });
  });

  return {
    availableProtocols,
  };
}

function extractProtocols(distributionCollection: DistributionCollection) {
  if (!distributionCollection) {
    return null;
  }
  const features = distributionCollection.features;

  if (!features.length) {
    return [];
  }

  return features.map((record: Distribution) => record.properties.protocol);
}
