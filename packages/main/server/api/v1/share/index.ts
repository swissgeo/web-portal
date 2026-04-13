const TARGET_BASE = 'https://unstreaming-unskillfully-daisey.ngrok-free.dev'

export default defineEventHandler(async (event) => {
    const path = event.context.params?.path ?? ''
    const query = getQuery(event)

    // Build the target URL, preserving the path and query params
    const targetUrl = new URL(`/${path}`, TARGET_BASE)
    for (const [key, value] of Object.entries(query)) {
        targetUrl.searchParams.set(key, String(value))
    }

    // Read the incoming body (will be null for GET/HEAD)
    let body: BodyInit | undefined
    const method = event.method

    if (!['GET', 'HEAD'].includes(method)) {
        const rawBody = await readRawBody(event)
        if (rawBody) body = rawBody
    }

    // Forward headers, strip host so the target doesn't reject the request
    const incomingHeaders = getHeaders(event)
    const forwardedHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(incomingHeaders)) {
        if (value === undefined) continue
        // Drop headers that shouldn't be forwarded
        if (['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) continue
        forwardedHeaders[key] = value
    }
    forwardedHeaders['ngrok-skip-browser-warning'] = '1'

    // Proxy the request
    const response = await fetch(targetUrl.toString(), {
        method,
        headers: forwardedHeaders,
        body,
        // Don't follow redirects automatically — pass them back to the client
        redirect: 'manual',
    })

    // Forward the response status and headers back to the client
    setResponseStatus(event, response.status, response.statusText)
    for (const [key, value] of response.headers.entries()) {
        // Skip headers that Nuxt/h3 manages itself
        if (['transfer-encoding', 'connection'].includes(key.toLowerCase())) continue
        setResponseHeader(event, key, value)
    }

    // Stream the response body back
    return sendStream(event, response.body!)
})
