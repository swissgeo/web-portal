import type { Ref } from 'vue'

import { registerProj4 } from '@swissgeo/coordinates'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import WMSCapabilitiesParser from 'ol/format/WMSCapabilities'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { computed, watchEffect } from 'vue'

import type { WMSCapabilityLayer } from '@/types/Capabilities'
import type { Service } from '@/types/Records'

type WMSCapabilities = ReturnType<InstanceType<typeof WMSCapabilitiesParser>['read']>

import { useCapabilities } from './useCapabilities'
;(function registerCustomProjection() {
    registerProj4(proj4)
    register(proj4)
})()

export function useWmsCapabilities(serviceData: Ref<Service>, layerId: Ref<string | null>) {
    const { capabilityUrl } = useCapabilities(serviceData)

    const { data: wmsCapabilityData } = useFetch<string>(capabilityUrl)

    const wmsData = computed(() => parseWmsCapabilities(wmsCapabilityData.value, layerId.value))

    watchEffect(() => {
        log.debug({
            title: 'useCapabilities',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['wms capability data is', wmsData.value],
        })
    })
    return {
        wmsData,
    }
}

export function parseWmsCapabilities(capabilityData: string, layerId: string | null) {
    if (!capabilityData || !layerId) {
        return
    }
    const wmsParser = new WMSCapabilitiesParser()
    const capabilities = wmsParser.read(capabilityData)

    const dimensions = getDimensions(capabilities, layerId)

    return {
        capabilities,
        dimensions,
    }
}

export function getDimensions(capabilities: WMSCapabilities, layerId: string) {
    if (!capabilities) {
        return null
    }

    const layerData = capabilities.Capability.Layer.Layer
    const thisLayer = layerData.find((_layer: WMSCapabilityLayer) => _layer.Name === layerId)
    if (thisLayer && 'Dimension' in thisLayer) {
        return thisLayer.Dimension
    }
}
