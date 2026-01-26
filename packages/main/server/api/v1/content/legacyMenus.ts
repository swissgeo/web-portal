import log from '@swissgeo/log'
import { joinURL } from 'ufo'

export default defineEventHandler(async () => {
    // const storage = useStorage('file') // TODO use another on k8s
    // const key = `api:menues`

    const runtimeConfig = useRuntimeConfig()
    const proxyUrl = runtimeConfig.apiEndpoint
    const authToken = runtimeConfig.authToken

    const target = joinURL(proxyUrl, 'menus')

    try {
        const data = await $fetch(target, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })

        return data
    } catch (err) {
        log.error({ messages: [err] })
    }

    return {}
})
