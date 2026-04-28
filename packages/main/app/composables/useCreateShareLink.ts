import type { AppStatePayload } from '@swissgeo/statesharing'

import { useFetch } from '@vueuse/core'

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