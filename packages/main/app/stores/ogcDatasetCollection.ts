import type { DatasetCollection } from '@swissgeo/ogc'
import type { Ref, WatchHandle } from 'vue'

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

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

    let localeWatchHandle: WatchHandle | null = null

    async function fetchForLanguage(language: string, options: FetchOptions = {}) {
        const { force = false } = options

        if (!force && currentLanguage.value === language && data.value) {
            return
        }

        if (inFlightRequest.value && inFlightLanguage.value === language) {
            await inFlightRequest.value
            return
        }

        inFlightLanguage.value = language
        inFlightRequest.value = (async () => {
            pending.value = true

            try {
                data.value = await $fetch<DatasetCollection>(runtimeConfig.public.ogcApiEndpoint, {
                    query: {
                        language,
                    },
                })
                currentLanguage.value = language
                error.value = null
            } catch (fetchError) {
                error.value = fetchError
            } finally {
                pending.value = false
                inFlightRequest.value = null
                inFlightLanguage.value = null
            }
        })()

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
        if (localeWatchHandle) {
            return
        }

        localeWatchHandle = watch(locale, (language) => {
            if (!initialized.value) {
                return
            }
            void fetchForLanguage(language, { force: true })
        })
    }

    return {
        data,
        pending,
        error,
        initialized,
        initialize,
        fetchForLanguage,
        startLocaleSync,
    }
})
