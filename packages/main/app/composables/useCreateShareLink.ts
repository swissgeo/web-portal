import type { AppStatePayload } from "~/composables/useStateConfig";
import type { MaybeRefOrGetter, Ref } from "vue";

import { watchDebounced } from "@vueuse/core";
import { postStateToStateId } from "~/utils/postStateToStateId";
import { toValue } from "vue";

import { URL_PARAM_STATE } from './useUrlParams'

function buildShareUrl(stateId: string | null): string {
  if (!stateId) {
    return "";
  }

    const url = new URL('', location.origin)
    url.searchParams.set(URL_PARAM_STATE, stateId)
    return url.href
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

function buildEmbedCode(stateId: string | null, zoomOnlyCtrl: boolean): string {
  if (!stateId) {
    return "";
  }

  const url = new URL("/embed", location.origin);
  url.searchParams.set("state", stateId);
  if (zoomOnlyCtrl) {
    url.searchParams.set("zoomOnlyCtrl", "true");
  }
  return `<iframe src="${url.href}" width="600" height="400" frameborder="0"></iframe>`;
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
  options?: { autoRefresh?: boolean; zoomOnlyCtrl?: Ref<boolean> },
) {
  const { exportState } = useStateConfig();
  const usableState = state ?? exportState;
  const { hash, needsRefresh, refresh } = useShareLinkState(usableState, {
    autoRefresh: options?.autoRefresh,
  });

  const needToRefresh = computed(
    () => !options?.autoRefresh && needsRefresh.value,
  );
  const shareLink = computed(() => buildShareUrl(hash.value));
  const embedCode = computed(() =>
    buildEmbedCode(hash.value, options?.zoomOnlyCtrl?.value ?? false),
  );

  return {
    shareLink,
    embedCode,
    hash,
    refresh,
    needToRefresh,
  };
}

export function useCreateShareLinkForPrint() {
    const viewStore = useMapViewStore()
    console.log('>>>>>>>>> viewStore.stateId', viewStore.stateId)

    const shareLink = computed(() => buildShareUrl(viewStore.stateId))
    return { shareLink }
}

/**
 * Add a custom state to the service (mock at the moment) with the state being a ref
 * so that this composable function can be used to push multiple states to the service,
 * for example when the print framing parameters change and we want to update the share link accordingly.
 * If the option forcePortableState is set to `true`, then the state will be encoded as base64 string and added to the share link as a query parameter,
 * instead of being sent to the service.
 */
export function useCreateShareLinkForCustomState(forcePortableState: boolean = false) {
    const state = ref<AppStatePayload | null>(null)
    const runtimeConfig = useRuntimeConfig()
    const hash = ref<string | null>(null)

    if (forcePortableState) {
        watchDebounced(
            state,
            () => {
                if (!state.value) {
                    hash.value = null
                    return
                }
                hash.value = btoa(JSON.stringify(state.value))
            },
            {
                deep: true,
                debounce: 500,
                maxWait: 1500,
            }
        )
    } else {
        const { data, execute, abort, isFetching } = useFetch<string>(
            runtimeConfig.public.shareServiceUrl,
            {
                immediate: false,
                refetch: false,
            }
        )
            .post(state)
            .text()

        hash.value = data.value

        watchDebounced(
            state,
            () => {
                if (!state.value) {
                    return
                }

                if (isFetching.value) {
                    abort()
                }

                void execute()
            },
            {
                deep: true,
                debounce: 500,
                maxWait: 1500,
            }
        )
    }

    const shareLink = computed(() => buildShareUrl(hash.value, forcePortableState))

  return {
    shareLink,
    hash,
    isFetching,
    state,
  };
}
