import type { AppStateConfig } from "@swissgeo/statesharing"

// URL param providing the ID to a state (map config such a center, resolution, print info, etc.)
const URL_PARAM_STATE = 'state'

export function useUrlParams() {
    const route = useRoute()
    const router = useRouter()

    /**
     * Read the state ID from URL param, load the state corresponding to this ID,
     * return it as a payload and removed the param from the URL
     */
    async function getStateFromUrl(): Promise<string | null> {
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
        });

        if (typeof stateId !== "string") {
            return null
        }

        return await getStateFromStateId(stateId);
    }

    return {
        getStateFromUrl,
    }

}



// Mock state payloads
const mockStates: Record<string, AppStateConfig> = {
    bern: {
        version: 0.2,
        map: {
            center: [
                2600776.991920504,
                1199396.1756454066
            ],
        zoom: 8.988,
        rotation: 0
        },
        layers: []
    },

    lausanne: {
        version: 0.2,
        map: {
            center: [
                2538218.903805259,
                1152575.3128110687
            ],
        zoom: 9.081,
        rotation: 0
        },
        layers: []
    },

    geneva: {
        version: 0.2,
        map: {
            center: [
                2500011.2297296845,
                1116299.0854585706
            ],
            zoom: 6.379,
            rotation: 0
        },
        layers: []
    },

    zurich: {
        version: 0.2,
        map: {
            center: [
                2682879.8449554853,
                1247142.0275131231
            ],
        zoom: 8.328,
        rotation: 0
        },
        layers: []
    },

    zurichprint: {
        version: 0.2,
        map: {
            center: [
                2682879.8449554853,
                1247142.0275131231
            ],
        zoom: 8.328,
        rotation: 0
        },
        layers: [],
        print: {
            orientation: 'landscape',
            format: 'a4',
            resolution: 96,
            scale: 50000,
        }
    }
}


/**
 * Mock function to retrieve a state from an ID.
 * Made async to be closer because the non-mock will have to be async
 */
async function getStateFromStateId(stateId: string): Promise<string | null> {
    return new Promise((resolve) => {
        if (stateId in mockStates) {
            resolve(JSON.stringify(mockStates[stateId]))
        }
        return resolve(null);
    })
}