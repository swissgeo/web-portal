import type { Ref } from 'vue'

import { useFetch } from '@vueuse/core'
import { watch } from 'vue'

/**
 * Wrapper around `@vueuse/core` useFetch because that can't deal with
 * refs to URLs that aren't set yet (e.g. null)
 * This will delay the triggering of the fetch until the URL is
 * actually not null anymore
 *
 * @param url Ref to URL (string) or null
 * @returns The instance of useFetch
 */
export function useConditionalFetch<T>(url: Ref<string | null>, builderFunctions?: string[]) {
    const fetchRef = useFetch<T>(url as unknown as string, {
        immediate: false,
    })

    if (builderFunctions) {
        for (const fn of builderFunctions) {
            // for instance to invoke .get() and .json() on the fetchRef
            // fetchRef is a builder object that gets internally built and updated when
            // calling these functions
            // somehow we have some weird condition sometimes as if we're chaining
            // it to the return of useConditionalFetch, then the fetchRef builder isn't
            // ready yet
            if (fn in fetchRef) {
                // @ts-expect-error Typescript doesn't like this
                fetchRef[fn]()
            }
        }
    }

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
