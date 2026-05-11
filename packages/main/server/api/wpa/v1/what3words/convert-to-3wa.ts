import log from '@swissgeo/log'
import { createError, getQuery } from 'h3'

const WHAT_3_WORDS_API_BASE_URL = 'https://api.what3words.com/v3'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const { lat, lon } = getQuery(event)

    if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required query parameters: lat, lon',
        })
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (isNaN(latNum) || isNaN(lonNum)) {
        throw createError({ statusCode: 400, statusMessage: 'lat and lon must be numeric' })
    }

    try {
        const data = await $fetch<{ words: string }>(
            `${WHAT_3_WORDS_API_BASE_URL}/convert-to-3wa`,
            {
                query: {
                    coordinates: `${latNum},${lonNum}`,
                    key: config.what3wordsApiKey,
                },
            }
        )

        return { words: data.words }
    } catch (error) {
        log.error(`what3words upstream error for coordinates ${latNum},${lonNum}: ${String(error)}`)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching what3words data',
        })
    }
})
