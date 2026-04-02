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

    const data = await $fetch<{ words: string }>(`${WHAT_3_WORDS_API_BASE_URL}/convert-to-3wa`, {
        query: {
            coordinates: `${lat},${lon}`,
            key: config.what3wordsApiKey,
        },
    })

    return { words: data.words }
})
