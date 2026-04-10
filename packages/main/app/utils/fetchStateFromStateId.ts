/**
 * Retrieve state from service-shortlink
 */
export async function fetchStateFromStateId(stateId: string): Promise<JSON | null> {
    const runtimeConfig = useRuntimeConfig()
    const shortLinkUrl = new URL(runtimeConfig.public.shareServiceUrl)
    shortLinkUrl.searchParams.set('state', stateId)

    const appConfig = await $fetch<JSON>(shortLinkUrl.toString())

    return appConfig
}
