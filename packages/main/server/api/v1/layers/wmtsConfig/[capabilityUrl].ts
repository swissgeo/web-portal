import jsdom from 'jsdom'

import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { registerProj4 } from '@swissgeo/coordinates'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

const dom = new jsdom.JSDOM()

// Registering stuff for the capabilities parser which would be there
// if this were a browser environment
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node

registerProj4(proj4)
register(proj4)

// TODO maybe this should also go into a package!
export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'capabilityUrl')
    if (!param) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Capability URL cannot be determined',
        })
    }
    const capabilityUrl = decodeURIComponent(param)

    const capabilitiesDocument = await $fetch(capabilityUrl)

    const parser = new WMTSCapabilities()
    const capabilities = parser.read(capabilitiesDocument)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return capabilities
})
