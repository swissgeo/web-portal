/**
 * Wrapper around fetch in order to add the necessary auth headers for livingdocs
 * @param url URL to fetch
 * @param options Dict of options to pass to fetch
 * @returns Promise with a response of T
 */
export default function useLdFetch() {
    const runtimeConfig = useRuntimeConfig()

    function ldFetch<T>(url: string, ...options: Record<string, T>[]): Promise<T> {
        const authToken = runtimeConfig.authToken
        return $fetch(url, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            ...options,
        })
    }

    return {
        ldFetch,
    }
}
