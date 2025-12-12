import { joinURL } from 'ufo'

export default defineEventHandler(async () => {
    // const storage = useStorage('file') // TODO use another on k8s
    // const key = `api:menues`

    const runtimeConfig = useRuntimeConfig()
    const proxyUrl = runtimeConfig.apiEndpoint
    const authToken = runtimeConfig.authToken

    const target = joinURL(proxyUrl, 'menus')

    // let data = await storage.getItem(key)

    // if (data) {
    //     console.log('Delivering menues from cache')
    // } else {
    console.log(`Fetching menus from ${target}`)
    try {
        const data = await $fetch(target, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })

        return data
    } catch (err) {
        console.error(err)
    }
    console.log('Done fetching menus')

    // await storage.setItem(key, data, { ttl: 60 })
    // }
    return {}
})
