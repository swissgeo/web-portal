export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const data = await $fetch<string>(
        'https://services.dev.sgdi.tech/api/oar/v0/tiles.json?lang=en',
        { responseType: 'text' }
    )
    const patched = data.replace('<KEY>', config.maptilerApiKey)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return patched
})
