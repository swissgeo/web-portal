// /en is reserved for the CMS. Return 404 so Nuxt does not intercept it.
// In production the reverse proxy routes /en to the CMS before Nuxt sees the request.
import { defineEventHandler, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
    setResponseStatus(event, 404)
})
