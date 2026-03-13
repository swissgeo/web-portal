import type { DatasetCollection } from '@swissgeo/ogc'
import type { EffectScope, Ref, WatchHandle } from 'vue'

import { defineStore } from 'pinia'
import { effectScope, ref, watch } from 'vue'

type FetchOptions = {
    force?: boolean
}

export const useOgcDatasetCollectionStore = defineStore('ogcDatasetCollection', () => {
    const runtimeConfig = useRuntimeConfig()

    const data = ref<DatasetCollection | null>(null)
    const pending = ref(false)
    const error = ref<unknown>(null)
    const initialized = ref(false)
    const currentLanguage = ref<string | null>(null)

    const inFlightLanguage = ref<string | null>(null)
    const inFlightRequest = ref<Promise<void> | null>(null)
    const latestRequestId = ref(0)

    const inFlightRequestsByLanguage = new Map<string, Promise<void>>()

    let localeWatchHandle: WatchHandle | null = null
    let localeWatchSource: Ref<string> | null = null
    let localeWatchScope: EffectScope | null = null

    async function fetchForLanguage(language: string, options: FetchOptions = {}) {
        const { force = false } = options

        if (!force && currentLanguage.value === language && data.value) {
            return
        }

        const existingLanguageRequest = inFlightRequestsByLanguage.get(language)
        if (existingLanguageRequest) {
            await existingLanguageRequest
            return
        }

        const requestId = latestRequestId.value + 1
        latestRequestId.value = requestId

        inFlightLanguage.value = language
        inFlightRequest.value = (async () => {
            pending.value = true

            try {
                const fetchedData = await $fetch<DatasetCollection>(
                    runtimeConfig.public.ogcApiEndpoint,
                    {
                        query: {
                            language,
                        },
                    }
                )

                // Ignore out-of-order responses from older locale requests.
                if (requestId !== latestRequestId.value) {
                    return
                }

                data.value = fetchedData
                currentLanguage.value = language
                error.value = null
            } catch (fetchError) {
                if (requestId === latestRequestId.value) {
                    error.value = fetchError
                }
            } finally {
                inFlightRequestsByLanguage.delete(language)

                if (requestId === latestRequestId.value) {
                    pending.value = false
                    inFlightRequest.value = null
                    inFlightLanguage.value = null
                }
            }
        })()

        inFlightRequestsByLanguage.set(language, inFlightRequest.value)

        await inFlightRequest.value
    }

    async function initialize(language: string) {
        if (initialized.value) {
            return
        }

        initialized.value = true
        await fetchForLanguage(language)

        // Keep initialized=true during fetch to avoid duplicate initialize calls,
        // but roll back when the first fetch did not populate data for the target locale.
        if (currentLanguage.value !== language || !data.value) {
            initialized.value = false
        }
    }

    function startLocaleSync(locale: Ref<string>) {
        if (localeWatchSource === locale && localeWatchHandle) {
            return
        }

        localeWatchHandle?.()
        localeWatchScope?.stop()
        localeWatchSource = locale

        // Use a detached scope so this watcher survives component unmount/remount cycles.
        localeWatchScope = effectScope(true)
        localeWatchScope.run(() => {
            localeWatchHandle = watch(locale, (language) => {
                if (!initialized.value) {
                    return
                }
                void fetchForLanguage(language, { force: true })
            })
        })
    }

    return {
        data,
        pending,
        error,
        initialized,
        currentLanguage,
        initialize,
        fetchForLanguage,
        startLocaleSync,
    }
})
