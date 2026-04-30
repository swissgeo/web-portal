/**
 * Retrieve state from service-shortlink
 */
export async function fetchStateFromStateId(
    stateId: string
): Promise<Record<string, unknown> | null> {
    // not using the state type yet as we haven't validated it yet
    const runtimeConfig = useRuntimeConfig()
    const shortLinkUrl = new URL(runtimeConfig.public.shareServiceUrl)
    shortLinkUrl.searchParams.set('state', stateId)

    const appConfig = await $fetch<Record<string, unknown>>(shortLinkUrl.toString())

    return appConfig
}
