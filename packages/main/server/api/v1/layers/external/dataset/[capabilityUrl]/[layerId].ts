import { DOMParser } from '@xmldom/xmldom'
import { appendResponseHeader, createError, getQuery, getRouterParam } from 'h3'

async function fetchLayerTitle(capabilityUrl: string, layerId: string): Promise<string | null> {
    try {
        const response = await fetch(capabilityUrl)
        if (!response.ok) {
            return null
        }
        const xml = await response.text()
        const doc = new DOMParser().parseFromString(xml, 'text/xml')
        return extractLayerTitle(doc, layerId)
    } catch {
        return null
    }
}

function extractLayerTitle(doc: Document, layerId: string): string | null {
    const rootName = doc.documentElement?.nodeName
    if (!rootName) {
        return null
    }

    if (rootName === 'Capabilities') {
        return findWmtsLayerTitle(doc, layerId)
    }
    if (rootName === 'WMS_Capabilities' || rootName === 'WMT_MS_Capabilities') {
        return findWmsLayerTitle(doc, layerId)
    }
    return null
}

function findWmtsLayerTitle(doc: Document, layerId: string): string | null {
    const layers = doc.getElementsByTagName('Layer')
    for (let i = 0; i < layers.length; i++) {
        const identifier = layers[i].getElementsByTagName('ows:Identifier')[0]?.textContent
        if (identifier === layerId) {
            return layers[i].getElementsByTagName('ows:Title')[0]?.textContent ?? null
        }
    }
    return null
}

function findWmsLayerTitle(doc: Document, layerId: string): string | null {
    const layers = doc.getElementsByTagName('Layer')
    for (let i = 0; i < layers.length; i++) {
        const name = layers[i].getElementsByTagName('Name')[0]?.textContent
        if (name === layerId) {
            return layers[i].getElementsByTagName('Title')[0]?.textContent ?? null
        }
    }
    return null
}

export default defineEventHandler(async (event) => {
    const capabilityUrlParam = getRouterParam(event, 'capabilityUrl')
    const layerId = getRouterParam(event, 'layerId')

    if (!capabilityUrlParam || !layerId) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Capability URL and Layer ID are required',
        })
    }

    const capabilityUrl = decodeURIComponent(capabilityUrlParam)
    const selfUrl = `/api/v1/layers/external/dataset/${capabilityUrlParam}/${layerId}`
    const distributionsUrl = `/api/v1/layers/external/${capabilityUrlParam}/${layerId}`
    const hostname = new URL(capabilityUrl).hostname

    const languageQuery = getQuery(event).language
    const language = typeof languageQuery === 'string' ? languageQuery : undefined
    const fetchUrl = new URL(capabilityUrl)
    if (language) {
        // language: OGC API convention; lang: swisstopo and various WMS servers
        fetchUrl.searchParams.set('language', language)
        fetchUrl.searchParams.set('lang', language)
    }

    const title =
        (await fetchLayerTitle(fetchUrl.toString(), layerId)) ?? `${layerId} on ${hostname}`

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        id: layerId,
        links: [
            {
                href: selfUrl,
                rel: 'self',
                title: 'This Record',
            },
            {
                href: distributionsUrl,
                rel: 'distributions',
                title: 'Distributions',
                type: 'application/json',
            },
        ],
        properties: {
            title,
            type: 'Dataset',
        },
    }
})
