import log, { LogPreDefinedColor } from '@swissgeo/log'
import { fetchStateFromStateId } from '~/utils/fetchStateFromStateId'

// URL param providing the ID to a state (map config such a center, resolution, print info, etc.)
const URL_PARAM_STATE = 'state'

export function useUrlParams() {
    const route = useRoute()
    const router = useRouter()

    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    function extractStateId(): string | null {
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

        log.debug({
            title: 'useUrlParam',
            titleColor: LogPreDefinedColor.Sky,
            messages: [
                'State found in the URL param, using this to fetch the state from the service',
                stateId,
            ],
        })

        return stateId
    }

    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    function getStateFromUrl(): Promise<unknown> {
        const stateId = extractStateId()
        if (!stateId) {
            return new Promise(() => null)
        }
        return fetchStateFromStateId(stateId)
    }

    return {
        getStateFromUrl,
        extractStateId,
    }
}
