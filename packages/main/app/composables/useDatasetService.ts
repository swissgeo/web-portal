import type { Distribution, Service } from "@swissgeo/ogc";
import type { MaybeRefOrGetter } from "vue";

import { extractCapabilityUrl, extractServiceUrl } from "@swissgeo/ogc";
import { isStacDistribution } from "~/utils/isStacDistribution";
import { resolveWebUrl } from "~/utils/resolveWebUrl";
import { computed, toValue } from "vue";

import { useDatasetResource } from "./useDatasetResource";
import { useStacBrowserAddress } from "./useStacBrowserAddress";

export function useDatasetService(
  distribution: MaybeRefOrGetter<Distribution>,
) {
  const serviceUrl = computed(() => {
    const links = toValue(distribution).links ?? [];
    const selfLink = links.find((link) => link.rel.toLowerCase() === "self");
    const sourceUrl = resolveWebUrl(selfLink?.href ?? null);
    const serviceHref = extractServiceUrl({ links });

    return resolveWebUrl(serviceHref, sourceUrl ?? undefined);
  });

  const { data, status, pending, error } = useDatasetResource<Service>(
    () => serviceUrl.value ?? "",
    {
      enabled: () => serviceUrl.value !== null,
    },
  );

  const service = computed(() => {
    if (!serviceUrl.value || status.value !== "success") {
      return null;
    }
    return data.value ?? null;
  });
  const resolution = computed(() => {
    try {
      return {
        address: resolveWebUrl(
          extractCapabilityUrl(service.value),
          serviceUrl.value ?? undefined,
        ),
        failed: false,
      };
    } catch {
      return { address: null, failed: true };
    }
  });

  const isStac = computed(() => isStacDistribution(toValue(distribution)));
  const collectionId = computed(() => {
    const ids = toValue(distribution).properties.externalIds ?? [];
    return ids.length === 1 ? (ids[0] ?? null) : null;
  });
  const browser = useStacBrowserAddress(
    () => (isStac.value ? resolution.value.address : null),
    collectionId,
  );

  return {
    address: computed(() => {
      if (isStac.value) {
        return browser.address.value;
      }
      return resolution.value.address;
    }),
    isLoading: computed(() => pending.value || browser.isLoading.value),
    error: computed(
      () =>
        Boolean(error.value) || resolution.value.failed || browser.error.value,
    ),
  };
}
