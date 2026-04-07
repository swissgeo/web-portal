import { useFetch } from '@vueuse/core'

// URL param providing the ID to a state (map config such a center, resolution, print info, etc.)
const URL_PARAM_STATE = 'state'

export function useUrlParams() {
    const route = useRoute()
    const router = useRouter()

    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    async function getStateFromUrl(): Promise<Record<string, unknown> | null> {
        const stateParam = route.query[URL_PARAM_STATE]

        if (!stateParam) {
            return null
        }

        // Extract the value, handling the case where multiple params with the same name exist
        const stateId = Array.isArray(stateParam) ? stateParam[0] : stateParam

        // remove the state ID from the URL (without page refresh)
        onNuxtReady(async () => {
            const newQuery = { ...route.query }
            delete newQuery[URL_PARAM_STATE]
            await router.replace({ query: newQuery })
        })

        if (typeof stateId !== 'string') {
            return null
        }

        return await getStateFromStateId(stateId)
    }

    return {
        getStateFromUrl,
    }
}

/**
 * Retrieve state from service-shortlink
 */
async function getStateFromStateId(stateId: string): Promise<Record<string, unknown> | null> {
    const runtimeConfig = useRuntimeConfig()
    const shortLinkUrl = new URL(runtimeConfig.public.shareServiceUrl)
    shortLinkUrl.searchParams.set('state', stateId)

    const { data: appConfig } = await useFetch<JSON>(shortLinkUrl.toString()).get().json()

    return appConfig.value
}
