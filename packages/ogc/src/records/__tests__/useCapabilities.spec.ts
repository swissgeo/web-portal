import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Service } from '@/types'

import { extractCapabilityUrl, useCapabilities } from '../useCapabilities'
import ChGeoadminWms from './fixtures/service_ch.admin.geo.wms.json'
import ChGeoadminWmts from './fixtures/service_ch.admin.geo.wmts.json'

describe('useCapabilities composable returning capability URL', () => {
    it('extracts the correct capability URL from WMTS service', () => {
        const service = ref<Service>(ChGeoadminWmts as Service)

        const { capabilityUrl } = useCapabilities(service)

        expect(capabilityUrl.value).toEqual(
            'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml'
        )
    })

    it('extracts the correct capability URL from WMS service', () => {
        const service = ref<Service>(ChGeoadminWms as Service)

        const { capabilityUrl } = useCapabilities(service)

        expect(capabilityUrl.value).toEqual(
            'https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&FORMAT=text/xml&lang={lang}'
        )
    })

    it('extracts the correct capabaility URL after it becomes available late', () => {
        const service = ref<Service | null>(null)

        const { capabilityUrl } = useCapabilities(service)
        expect(capabilityUrl.value).toBe(null)

        service.value = ChGeoadminWmts as Service

        expect(capabilityUrl.value).toEqual(
            'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml'
        )
    })
})

describe('extractCapabilitUrl', () => {
    it('handles invalid service data', () => {
        const service: Pick<Service, 'links' | 'linkTemplates'> = {
            links: [],
        }

        const capabilitUrl = extractCapabilityUrl(service)
        expect(capabilitUrl).toBe(null)
    })

    it('handles invalid link data', () => {
        const service = {
            links: [
                {
                    rel: 'about',
                    // href is missing
                },
            ],
        }

        // @ts-expect-error Intentionally not giving href
        const capabilitUrl = extractCapabilityUrl(service)
        expect(capabilitUrl).toBe(null)
    })

    it('handles invalid linkTemplate data', () => {
        const service = {
            linksTemplates: [
                {
                    rel: 'about',
                    // uriTemplate is missing
                },
            ],
        }

        // @ts-expect-error Intentionally not giving href
        const capabilitUrl = extractCapabilityUrl(service)
        expect(capabilitUrl).toBe(null)
    })

    it('precedes link over linkTemplate', () => {
        const service = {
            linksTemplates: [
                {
                    rel: 'about',
                    uriTemplate: 'http://cool-template-link',
                },
            ],
            links: [
                {
                    rel: 'about',
                    href: 'http://cool-href-link',
                },
            ],
        }

        const capabilitUrl = extractCapabilityUrl(service)
        expect(capabilitUrl).toEqual('http://cool-href-link')
    })

    it.each(['about', 'ABOUT', 'aBout', 'About'])('can handle all cases of rel about', (rel) => {
        const service = {
            links: [
                {
                    rel,
                    href: 'http://about',
                },
            ],
        }

        const capabilitUrl = extractCapabilityUrl(service)
        expect(capabilitUrl).toEqual('http://about')
    })
})
