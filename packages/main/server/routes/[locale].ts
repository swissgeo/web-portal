// /<locale> paths are reserved for the CMS. Return 404 so Nuxt does not intercept them.
// In production the reverse proxy routes locale paths to the CMS before Nuxt sees the request.
import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'

const LOCALES = new Set(['de', 'fr', 'en', 'it', 'rm'])

export default defineEventHandler((event) => {
    const locale = getRouterParam(event, 'locale') ?? ''
    if (LOCALES.has(locale)) {
        setResponseStatus(event, 404)
    }
})
