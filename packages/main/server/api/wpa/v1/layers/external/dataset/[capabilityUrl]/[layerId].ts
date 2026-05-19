import { DOMParser } from '@xmldom/xmldom'
import { appendResponseHeader, createError, getQuery, getRouterParam } from 'h3'

type CapabilitiesType = 'WMS' | 'WMTS'

enum TagNames {
    WMS_IDENTIFIER = 'Name',
    WMTS_IDENTIFIER = 'ows:Identifier',
    WMS_TITLE = 'Title',
    WMTS_TITLE = 'ows:Title',
}

function detectCapabilitiesType(rootName: string): CapabilitiesType {
    if (rootName === 'Capabilities') {
        return 'WMTS'
    }
    if (rootName === 'WMS_Capabilities' || rootName === 'WMT_MS_Capabilities') {
        return 'WMS'
    }
    throw createError({
        status: 502,
        statusMessage: 'Bad Gateway',
        message: `Unrecognised capabilities root element: ${rootName}`,
    })
}

async function fetchLayerTitle(capabilityUrl: string, layerId: string): Promise<string> {
    const response = await fetch(capabilityUrl)
    if (!response.ok) {
        throw createError({
            status: 502,
            statusMessage: 'Bad Gateway',
            message: `Capabilities fetch failed (${response.status}) for ${capabilityUrl}`,
        })
    }

    const xml = await response.text()
    const doc = new DOMParser().parseFromString(xml, 'text/xml')

    const rootName = doc.documentElement?.nodeName
    if (!rootName) {
        throw createError({
            status: 502,
            statusMessage: 'Bad Gateway',
            message: 'Capabilities document has no root element',
        })
    }

    const capabilitiesType = detectCapabilitiesType(rootName)
    const identifierTag = TagNames[`${capabilitiesType}_IDENTIFIER`]
    const titleTag = TagNames[`${capabilitiesType}_TITLE`]

    const layers = doc.getElementsByTagName('Layer')
    for (let i = 0; i < layers.length; i++) {
        const identifier = layers[i].getElementsByTagName(identifierTag)[0]?.textContent
        if (identifier !== layerId) {
            continue
        }
        const title = layers[i].getElementsByTagName(titleTag)[0]?.textContent
        if (!title) {
            throw createError({
                status: 502,
                statusMessage: 'Bad Gateway',
                message: `Layer "${layerId}" has no <${titleTag}> in capabilities`,
            })
        }
        return title
    }

    throw createError({
        status: 404,
        statusMessage: 'Not Found',
        message: `Layer "${layerId}" not found in capabilities`,
    })
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
    const selfUrl = `/api/wpa/v1/layers/external/dataset/${capabilityUrlParam}/${layerId}`
    const distributionsUrl = `/api/wpa/v1/layers/external/${capabilityUrlParam}/${layerId}`

    const languageQuery = getQuery(event).language
    const language = typeof languageQuery === 'string' ? languageQuery : undefined
    const fetchUrl = new URL(capabilityUrl)
    if (language) {
        // language: OGC API convention; lang: swisstopo and various WMS servers
        fetchUrl.searchParams.set('language', language)
        fetchUrl.searchParams.set('lang', language)
    }

    const title = await fetchLayerTitle(fetchUrl.toString(), layerId)

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
