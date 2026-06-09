import type { ComputedRef, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type {
  Distribution,
  DistributionCollection,
  ServiceProtocol,
} from "@/types/Records";

export function useDistributionProtocols(
  distributionCollection: Ref<DistributionCollection>,
): {
  availableProtocols: ComputedRef<ServiceProtocol[]>;
} {
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
  const records = distributionCollection.records;

  if (!records.length) {
    return [];
  }

  return records.map((record: Distribution) => record.properties.protocol);
}
