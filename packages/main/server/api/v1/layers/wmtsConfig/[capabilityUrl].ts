import jsdom from 'jsdom'

import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { optionsFromCapabilities } from 'ol/source/WMTS'
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
    const data = JSON.parse(await readBody(event))

    let url
    if ('href' in data) {
        // TODO deal with uriTemplates
        url = data.href
    }

    const capabilitiesDocument = await $fetch(url)

    const parser = new WMTSCapabilities()
    const capabilities = parser.read(capabilitiesDocument)
    // const options = optionsFromCapabilities(capabilities, {
    //     layer: data.layerId,
    // })
    // console.log(options)
    appendResponseHeader(event, 'Content-Type', 'application/json')
    return capabilities
})
