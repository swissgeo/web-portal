import type { AppStatePayload } from "~/composables/useStateConfig";
import type { MaybeRefOrGetter } from "vue";

import { watchDebounced } from "@vueuse/core";
import { postStateToStateId } from "~/utils/postStateToStateId";
import { toValue } from "vue";

function buildShareUrl(stateId: string | null): string {
  if (!stateId) {
    return "";
  }

  const url = new URL("", location.origin);
  url.searchParams.set("state", stateId);
  return url.href;
}

/**
 * Options for controlling share link state generation.
 *
 * - `autoRefresh: true` — automatically POST state to the API whenever it changes.
 *   Optionally debounce with `debounce`/`maxWait`.
 * - `autoRefresh: false` (default) — tracks changes but only fetches when `refresh()` is called.
 *   The `debounce` option is ignored when `autoRefresh` is false.
 */
type ShareLinkOptions = {
  autoRefresh?: boolean;
  debounce?: number;
  deep?: boolean;
  maxWait?: number;
  onError?: (error: unknown) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function useShareLinkState(
  state: MaybeRefOrGetter<AppStatePayload | null>,
  options: ShareLinkOptions = {},
) {
  const hash = ref<string | null>(null);
  const needsRefresh = ref(false);
  const isFetching = ref(false);
  let abortController: AbortController | null = null;

  const syncHash = async (newState: AppStatePayload) => {
    if (abortController) {
      abortController.abort();
    }

    const currentController = new AbortController();
    abortController = currentController;
    isFetching.value = true;

    try {
      hash.value = await postStateToStateId(newState.state, {
        signal: currentController.signal,
      });
      needsRefresh.value = false;
    } catch (error) {
      if (!isAbortError(error)) {
        options.onError?.(error);
      }
    } finally {
      if (abortController === currentController) {
        abortController = null;
        isFetching.value = false;
      }
    }
  };

  const watchSource = () => toValue(state);
  const watchOptions = {
    deep: options.deep ?? false,
    immediate: true,
  };
  const onStateChange = (newState: AppStatePayload | null) => {
    if (!newState) {
      return;
    }
    void syncHash(newState);
  };

  if (options.autoRefresh) {
    if (options.debounce) {
      watchDebounced(watchSource, (newState) => onStateChange(newState), {
        ...watchOptions,
        debounce: options.debounce,
        maxWait: options.maxWait,
      });
    } else {
      watch(watchSource, (newState) => onStateChange(newState), watchOptions);
    }
  } else {
    watch(
      watchSource,
      (newState) => {
        if (!newState) {
          return;
        }

        needsRefresh.value = true;
      },
      watchOptions,
    );
  }

  const refresh = async () => {
    const currentState = toValue(state);
    if (!currentState) {
      return;
    }

    await syncHash(currentState);
  };

  return {
    hash,
    isFetching,
    needsRefresh,
    refresh,
  };
}

/**
 * Creates a reactive share link from the current app state.
 *
 * By default (`autoRefresh = false`), the hash is NOT fetched automatically.
 * Call `refresh()` to generate the link, and check `needToRefresh` to show
 * a "regenerate" UI when the state has changed since the last fetch.
 *
 * Pass `autoRefresh = true` to fetch the hash immediately on mount
 * and re-fetch whenever the state changes.
 */
export function useCreateShareLink(
  state?: MaybeRefOrGetter<AppStatePayload | null>,
  autoRefresh: boolean = false,
) {
  const { exportState } = useStateConfig();
  const usableState = state ?? exportState;
  const { hash, needsRefresh, refresh } = useShareLinkState(usableState, {
    autoRefresh,
  });

  const needToRefresh = computed(() => !autoRefresh && needsRefresh.value);
  const shareLink = computed(() => buildShareUrl(hash.value));

  return {
    shareLink,
    hash,
    refresh,
    needToRefresh,
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
  const { hash, isFetching } = useShareLinkState(state, {
    autoRefresh: true,
    debounce: 500,
    deep: true,
    maxWait: 1500,
    onError: () => {
      toaster.showWarning(t("state.shareLinkError"));
    },
  });

  const shareLink = computed(() => buildShareUrl(hash.value));

  return {
    shareLink,
    hash,
    isFetching,
    state,
  };
}
