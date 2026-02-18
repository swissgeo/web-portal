export default defineEventHandler(async (event) => {
    const data = await $fetch('https://services.dev.sgdi.tech/api/oar/v0/tiles.json?lang=en')

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return data
})
