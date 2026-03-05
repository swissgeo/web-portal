import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { computed, toValue, watchEffect } from 'vue'

import type { Service } from '@/types/Records'

export function useCapabilities(serviceData: Ref<Service | null>) {
    const capabilityUrl = computed(() => extractCapabilityUrl(serviceData.value))

    watchEffect(() => {
        log.debug({
            title: 'useCapabilities',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['Capability URL is now', toValue(capabilityUrl)],
        })
    })

    return {
        capabilityUrl,
    }
}

export function extractCapabilityUrl(serviceData: Service | null): string | null {
    // TODO safeguard for layers that don't support this
    if (!serviceData) {
        return null
    }

    if ('links' in serviceData && serviceData.links && serviceData.links.length) {
        const link = serviceData.links[0]

        if (link!.rel === 'about') {
            const uri = link!.href
            return uri
        }
    }
    if (
        'linkTemplates' in serviceData &&
        serviceData.linkTemplates &&
        serviceData.linkTemplates.length
    ) {
        // if there are links and linkTemplates, we want links to take precedence
        // it's the simpler version
        const link = serviceData.linkTemplates[0]

        if (link!.rel === 'about') {
            const uri = link!.uriTemplate.replace('{EPSG}', '2056')
            return uri
        }
    }
    throw new Error(`Unable to find links for`)
}
