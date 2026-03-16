// /rm is reserved for the CMS. Return 404 so Nuxt does not intercept it.
// In production the reverse proxy routes /rm to the CMS before Nuxt sees the request.
export default defineEventHandler(() => {
    throw createError({ statusCode: 404 })
})
