import type { ElevationProfileResponse } from '@swissgeo/elevation-profile'
import type { LineString } from 'geojson'
import type { MaybeRefOrGetter, Ref, ComputedRef } from 'vue'

import log from '@swissgeo/log'
import { useDebounceFn } from '@vueuse/core'
import { computed, toValue, watch } from 'vue'

export function useElevationProfile(
    lineString: Ref<LineString | null> | ComputedRef<LineString | null>,
    epsgNumber: MaybeRefOrGetter<number> = 2056
) {
    const { t } = useI18n()
    const toaster = useToaster()

    const body = computed(() => {
        const geojson = lineString.value
        if (!geojson) {
            return null
        }
        return { geojson, sr: toValue(epsgNumber) }
    })

    const { data, pending, error, execute } = useFetch<ElevationProfileResponse>(
        '/api/v1/elevation/profile',
        {
            method: 'POST',
            body,
            immediate: false,
            watch: false,
            onResponseError: ({ error }) => {
                log.error(`Error fetching elevation profile: ${String(error)}`)
                toaster.showError(t('elevationProfile.fetchError'))
            },
            onRequestError: ({ error }) => {
                log.error(`Error fetching elevation profile: ${String(error)}`)
                toaster.showError(t('elevationProfile.fetchError'))
            },
        }
    )

    const debouncedExecute = useDebounceFn(() => void execute(), 300)

    watch(
        lineString,
        (val) => {
            if (val) {
                error.value = undefined
                void debouncedExecute()
            }
        },
        { immediate: true }
    )

    return {
        elevationProfile: data,
        elevationPending: pending,
        elevationError: error,
    }
}
