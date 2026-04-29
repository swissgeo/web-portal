import type { ElevationProfileResponse } from '@swissgeo/shared/api'
import type { LineString } from 'geojson'
import type { Ref, ComputedRef } from 'vue'

import log from '@swissgeo/log'

export function useElevationProfile(lineString: Ref<LineString | null> | ComputedRef<LineString | null>) {
    const { data, pending, execute } = useFetch<ElevationProfileResponse>('/api/v1/elevation/profile', {
        method: 'POST',
        body: lineString,
        immediate: false,
        watch: false,
        onResponseError: ({ error }) => {
            log.error(`Error fetching elevation profile: ${String(error)}`)
        },
    })

    watch(lineString, (val) => {
        if (val) {
            void execute()
        }
    }, { immediate: true })

    return {
        elevationProfile: data,
        elevationPending: pending,
    }
}
