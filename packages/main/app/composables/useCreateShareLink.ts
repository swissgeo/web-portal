import type { AppStatePayload } from '@swissgeo/statesharing'

import { useFetch, watchDebounced } from '@vueuse/core'

function buildShareUrl(stateId: string | null): string {
    if (!stateId) {
        return ''
    }

    const url = new URL('', location.origin)
    url.searchParams.set('state', stateId)
    return url.href
}

export function useCreateShareLink(state?: Ref<AppStatePayload>) {
    let usableState = state

    if (!usableState) {
        const { exportState } = useStateConfig()
        usableState = exportState
    }

    const runtimeConfig = useRuntimeConfig()

    // intentionally not using nuxt's useFetch as the one frome vueuse suits more the
    // usecase here and doesn't have anything to do with SSR
    const { data: hash } = useFetch<string>(runtimeConfig.public.shareServiceUrl, { refetch: true })
        .post(usableState)
        .text()

    const shareLink = computed(() => buildShareUrl(hash.value))

    return {
        shareLink,
        hash,
    }
}

/**
 * Create a link for the print. The key difference from the function useCreateShareLink
 * is that
 */
export function useCreateShareLinkForPrint() {
    const viewStore = useMapViewStore()
    const shareLink = computed(() => buildShareUrl(viewStore.stateId))
    return { shareLink }
}

/**
 * Add a custom state to the service (mock at the moment) with the state being a ref
 * so that this composable function can be used to push multiple states to the service,
 * for example when the print framing parameters change and we want to update the share link accordingly.
 */
export function useCreateShareLinkForCustomState() {
    const state = ref<AppStatePayload | null>(null)
    const runtimeConfig = useRuntimeConfig()

    const {
        data: hash,
        execute,
        abort,
        isFetching,
    } = useFetch<string>(runtimeConfig.public.shareServiceUrl, {
        immediate: false,
        refetch: false,
    })
        .post(state)
        .text()

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

    const shareLink = computed(() => buildShareUrl(hash.value))

    return {
        shareLink,
        hash,
        state,
    }
}
