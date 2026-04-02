import {
    createApp,
    createError,
    createRouter,
    defineEventHandler,
    readBody,
    getQuery,
    appendResponseHeader,
} from 'h3'
import { createHash } from 'node:crypto'
import fs from 'node:fs'

const DIR = '/tmp/service-shortlink'

export const app = createApp({
    onError: (error) => {
        console.error(error)
    },
    onRequest: (event) => {
        console.log(`${event.method} Request to`, event.path)
    },
})

const router = createRouter()
app.use(router)

function sha256(content: string) {
    return createHash('sha256').update(content).digest('hex')
}

router.post(
    '/',
    defineEventHandler(async (event) => {
        appendResponseHeader(event, 'Access-Control-Allow-Origin', '*')
        const body = await readBody(event)
        const hash = sha256(JSON.stringify(body))

        // apparently hashes can be truncated... it could potentially lead to more collisions apparently,
        // but I'm no crypto expert
        const shortHash = hash.slice(0, 25)

        await fs.promises.mkdir(DIR, { recursive: true })
        await fs.promises.writeFile(`${DIR}/${shortHash}`, JSON.stringify(body))

        return shortHash
    })
)

router.options(
    '/',
    defineEventHandler(async (event) => {
        appendResponseHeader(event, 'Access-Control-Allow-Origin', '*')
        appendResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
        return ''
    })
)

router.get(
    '/',
    defineEventHandler<{ query: { state: string } }>(async (event) => {
        const query = getQuery(event)
        const hash = query.state

        appendResponseHeader(event, 'Access-Control-Allow-Origin', '*')

        if (!hash) {
            throw createError({
                status: 400,
                message: 'Bad Request',
                statusMessage: 'No state param was provided',
            })
        }

        const sanitizedHash = hash.replace('/', '')
        const path = `${DIR}/${sanitizedHash}`

        if (!fs.existsSync(path)) {
            throw createError({
                status: 404,
                message: 'Not found',
                statusMessage: 'Unable to find the saved state / hash',
            })
        }

        try {
            const state = await fs.promises.readFile(path)
            return state
        } catch (error) {
            throw createError({
                status: 400,
                message: 'Bad Request',
            })
        }
    })
)
