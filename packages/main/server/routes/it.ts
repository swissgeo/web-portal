// /it is reserved for the CMS. Return 404 so Nuxt does not intercept it.
// In production the reverse proxy routes /it to the CMS before Nuxt sees the request.
export default defineEventHandler(() => {
    throw createError({ statusCode: 404 })
})
