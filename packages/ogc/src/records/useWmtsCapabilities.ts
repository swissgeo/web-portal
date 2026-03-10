import type { Ref } from 'vue'

import { registerProj4 } from '@swissgeo/coordinates'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import WMTSCapabilitiesParser from 'ol/format/WMTSCapabilities'
import { register } from 'ol/proj/proj4'
import { optionsFromCapabilities } from 'ol/source/WMTS'
import proj4 from 'proj4'
import { computed, watchEffect } from 'vue'

import type { WMTSCapabilityLayer } from '@/types/Capabilities'
import type { Service } from '@/types/Records'

type WMTSCapabilities = ReturnType<InstanceType<typeof WMTSCapabilitiesParser>['read']>

import { useCapabilities } from './useCapabilities'
import { useConditionalFetch } from './useConditionalFetch'
;(function registerCustomProjection() {
    registerProj4(proj4)
    register(proj4)
})()

export function useWmtsCapabilities(serviceData: Ref<Service | null>, layerId: Ref<string | null>) {
    const { capabilityUrl } = useCapabilities(serviceData)

    const { data: wmtsCapabilityData } = useConditionalFetch<string>(capabilityUrl)

    const wmtsData = computed(() => parseWmtsCapabilities(wmtsCapabilityData.value, layerId.value))

    watchEffect(() => {
        log.debug({
            title: 'useCapabilities',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['wmts capability data is', wmtsData.value],
        })
    })

    return {
        capabilityUrl,
        wmtsData,
    }
}

export function parseWmtsCapabilities(capabilityData: string | null, layerId: string | null) {
    if (!capabilityData || !layerId) {
        return
    }

    const wmtsParser = new WMTSCapabilitiesParser()
    const capabilities = wmtsParser.read(capabilityData)

    const options = optionsFromCapabilities(capabilities, {
        layer: layerId,
    })

    const dimensions = getDimensions(capabilities, layerId)

    return {
        capabilities,
        options,
        dimensions,
    }
}

export function getDimensions(capabilities: WMTSCapabilities, layerId: string) {
    if (!capabilities) {
        return null
    }
    const capabilityOfLayer = capabilities.Contents.Layer.find(
        (layerEntry: WMTSCapabilityLayer) => layerEntry.Identifier === layerId
    )

    if (!capabilityOfLayer) {
        return undefined
    }

    return capabilityOfLayer.Dimension
}
