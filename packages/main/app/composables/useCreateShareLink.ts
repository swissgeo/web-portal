import type { AppStatePayload } from "~/composables/useStateConfig";

import { watchDebounced } from "@vueuse/core";
import { postStateToStateId } from "~/utils/postStateToStateId";

function buildShareUrl(stateId: string | null): string {
  if (!stateId) {
    return "";
  }

  const url = new URL("", location.origin);
  url.searchParams.set("state", stateId);
  return url.href;
}

export function useCreateShareLink(state?: Ref<AppStatePayload>) {
  const { exportState } = useStateConfig();
  const usableState = state ?? exportState;

  const hash = ref<string | null>(null);

  watch(
    usableState,
    async (newState) => {
      hash.value = await postStateToStateId(newState.state);
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
  const { t } = useI18n();
  const toaster = useToaster();
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
        hash.value = await postStateToStateId(newState.state, {
          signal: abortController.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        toaster.showWarning(t("state.shareLinkError"));
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
