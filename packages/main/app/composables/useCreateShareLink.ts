import type { AppStateConfig } from '@swissgeo/statesharing'

import { useFetch } from '@vueuse/core'

export function useCreateShareLink(state: Ref<AppStateConfig>) {
    const runtimeConfig = useRuntimeConfig()

    // intentionally not using nuxt's useFetch as the one frome vueuse suits more the
    // usecase here and doesn't have anything to do with SSR
    const { data: hash } = useFetch<string>(runtimeConfig.public.shareServiceUrl, { refetch: true })
        .post(state)
        .text()

    const shareLink = computed(() => {
        if (hash.value) {
            const baseUrl = new URL(document.location.href)
            const params = baseUrl.searchParams
            params.set('state', hash.value)

            return baseUrl.toString()
        } else {
            return ''
        }
    })

    return {
        shareLink,
    }
}
