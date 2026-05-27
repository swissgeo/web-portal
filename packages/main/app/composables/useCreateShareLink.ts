import type { AppStatePayload } from "~/composables/useStateConfig";
import type { SaveAppStateResponse } from "@swissgeo/statesharing";

import { watchDebounced } from "@vueuse/core";

const STATE_PROXY_URL = "/api/wpa/v1/state";

function buildShareUrl(stateId: string | null): string {
  if (!stateId) {
    return "";
  }

  const url = new URL("", location.origin);
  url.searchParams.set("state", stateId);
  return url.href;
}

async function saveState(state: AppStatePayload): Promise<string | null> {
  try {
    const response = await $fetch<SaveAppStateResponse>(STATE_PROXY_URL, {
      method: "POST",
      body: { state: state.state },
    });
    return response.id;
  } catch {
    return null;
  }
}

export function useCreateShareLink(state?: Ref<AppStatePayload>) {
  let usableState = state;

  if (!usableState) {
    const { exportState } = useStateConfig();
    usableState = exportState;
  }

  const hash = ref<string | null>(null);

  watch(
    usableState,
    async (newState) => {
      hash.value = await saveState(newState);
    },
    { immediate: true },
  );

  const shareLink = computed(() => buildShareUrl(hash.value));

  return {
    shareLink,
    hash,
  };
}

export function useCreateShareLinkForPrint() {
  const viewStore = useMapViewStore();
  const shareLink = computed(() => buildShareUrl(viewStore.stateId));
  return { shareLink };
}

export function useCreateShareLinkForCustomState() {
  const state = ref<AppStatePayload | null>(null);
  const hash = ref<string | null>(null);
  const isFetching = ref(false);
  let abortController: AbortController | null = null;

  watchDebounced(
    state,
    async (newState) => {
      if (!newState) {
        return;
      }

      if (isFetching.value && abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      isFetching.value = true;

      try {
        const response = await $fetch<SaveAppStateResponse>(STATE_PROXY_URL, {
          method: "POST",
          body: { state: newState.state },
          signal: abortController.signal,
        });
        hash.value = response.id;
      } catch {
        // aborted or network error — silently ignore
      } finally {
        isFetching.value = false;
      }
    },
    {
      deep: true,
      debounce: 500,
      maxWait: 1500,
    },
  );

  const shareLink = computed(() => buildShareUrl(hash.value));

  return {
    shareLink,
    hash,
    state,
  };
}
