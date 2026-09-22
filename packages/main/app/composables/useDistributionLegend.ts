import type { Distribution, Service } from "@swissgeo/ogc";
import type { MaybeRefOrGetter, Ref } from "vue";

import {
  useService,
  useWmsCapabilities,
  useWmtsCapabilities,
} from "@swissgeo/ogc";
import { determineFormat } from "~/utils/determineFormat";
import { computed, toValue } from "vue";

export function useDistributionLegend(
  distribution: MaybeRefOrGetter<Distribution>,
  layerId: MaybeRefOrGetter<string>,
) {
  const service = useService(
    computed(() => {
      const record = toValue(distribution);
      return { ...record, links: record.links ?? [] };
    }),
  );

  const { format, wms, wmts, capabilities } = useLegendCapabilities(
    distribution,
    service.serviceData,
    layerId,
  );

  const isLoading = computed(() => {
    if (service.isFetching.value) {
      return true;
    }
    return capabilities.value.isFetching.value;
  });

  const error = computed(() => {
    if (service.error.value) {
      return service.error.value;
    }
    return capabilities.value.error.value;
  });

  const legends = computed(() => {
    if (format.value === "WMS") {
      return wms.wmsData.value?.legends ?? [];
    }
    return wmts.wmtsData.value?.legends ?? [];
  });

  return { legends, isLoading, error };
}

function useLegendCapabilities(
  distribution: MaybeRefOrGetter<Distribution>,
  serviceData: Ref<Service | null>,
  layerId: MaybeRefOrGetter<string>,
) {
  const format = computed(() => determineFormat(toValue(distribution)));

  const wmsService = computed(() => {
    if (format.value === "WMS") {
      return serviceData.value;
    }
    return null;
  });

  const wmtsService = computed(() => {
    if (format.value === "WMTS") {
      return serviceData.value;
    }
    return null;
  });

  const id = computed(() => toValue(layerId));
  const wms = useWmsCapabilities(wmsService, id);
  const wmts = useWmtsCapabilities(wmtsService, id);

  const capabilities = computed(() => {
    if (format.value === "WMS") {
      return wms;
    }
    return wmts;
  });

  return { format, wms, wmts, capabilities };
}
