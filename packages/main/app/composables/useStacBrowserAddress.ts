import type { Link } from "@swissgeo/ogc";
import type { MaybeRefOrGetter } from "vue";

import { resolveWebUrl } from "~/utils/resolveWebUrl";
import { computed, toValue } from "vue";

import { useDatasetResource } from "./useDatasetResource";

type LinkedResource = { links?: Link[] };

export function useStacBrowserAddress(
  endpoint: MaybeRefOrGetter<string | null>,
  collectionId: MaybeRefOrGetter<string | null>,
) {
  const rootUrl = computed(() => {
    if (!toValue(collectionId)) {
      return null;
    }
    return toValue(endpoint);
  });

  const root = useDatasetResource<LinkedResource>(() => rootUrl.value ?? "", {
    enabled: () => Boolean(rootUrl.value),
  });

  const collectionUrl = computed(() => {
    if (!rootUrl.value || root.status.value !== "success") {
      return null;
    }

    const link = root.data.value?.links?.find(
      (link) => link.rel.toLowerCase() === "data",
    );

    const collectionsUrl = resolveWebUrl(link?.href ?? null, rootUrl.value);
    const id = toValue(collectionId);

    if (!collectionsUrl || !id) {
      return null;
    }
    const url = new URL(collectionsUrl);
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
    return url.href;
  });

  const collection = useDatasetResource<LinkedResource>(
    () => collectionUrl.value ?? "",
    {
      enabled: () => Boolean(collectionUrl.value),
    },
  );

  const address = computed(() => {
    if (!collectionUrl.value || collection.status.value !== "success") {
      return null;
    }

    const browserLink = collection.data.value?.links?.find(
      (link) =>
        link.rel.toLowerCase() === "alternate" && link.type === "text/html",
    );
    return resolveWebUrl(browserLink?.href ?? null, collectionUrl.value);
  });

  return {
    address,
    isLoading: computed(() => root.pending.value || collection.pending.value),
    error: computed(() => root.error.value ?? collection.error.value),
  };
}
