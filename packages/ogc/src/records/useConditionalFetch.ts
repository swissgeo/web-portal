import type { Ref } from 'vue'

import { useFetch } from '@vueuse/core'
import { watch } from 'vue'

/**
 * Wrapper around @vueuse/core's useFetch because that can't deal with
 * refs to URLs that aren't set yet (e.g. null)
 * This will delay the triggering of the fetch until the URL is
 * actually not null anymore
 *
 * @param url Ref to URL (string) or null
 * @returns The instance of useFetch
 */
export function useConditionalFetch<T>(url: Ref<string | null>) {
    const fetchRef = useFetch<T>(url as unknown as string, {
        immediate: false,
    })

    watch(
        url,
        (newUrl, _previousUrl, onCleanup) => {
            if (!newUrl) {
                return
            }

            // Cancel stale in-flight requests when the target URL changes.
            fetchRef.abort()
            void fetchRef.execute()

            onCleanup(() => {
                fetchRef.abort()
            })
        },
        { immediate: true }
    )

    return fetchRef
}
