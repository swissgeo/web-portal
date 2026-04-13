import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import fs from 'node:fs'
import { resolve } from 'path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Service } from '@/types'

import { parseWmsCapabilities, useWmsCapabilities } from '../useWmsCapabilities'
import ChGeoadminWms from './fixtures/service_ch.admin.geo.wms.json'

const wmsPath = resolve(__dirname, 'fixtures/capabilities_wms.geo.admin.ch.xml')
const capabilitiesXML = fs.readFileSync(wmsPath, 'utf-8')

describe('useWmsCapabilities fetching and parsing WMS capabilities', () => {
    const handlers = [
        http.get(
            'https://wms.geo.admin.ch/',
            // MSW doesn't allow query params in the request handler. Adding them here for reference:
            // ?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&FORMAT=text%2Fxml&lang=de
            () => {
                return HttpResponse.xml(capabilitiesXML)
            }
        ),
    ]
    const server = setupServer(...handlers)

    beforeAll(() => server.listen())

    afterAll(() => server.close())

    afterEach(() => server.resetHandlers())

    it('fetches the WMS capabilities', async () => {
        const service = ref<Service>(ChGeoadminWms as Service)
        const layerId = ref('ch.bafu.alpweiden-herdenschutzhunde')

        const { wmsData } = useWmsCapabilities(service, layerId)
        await flushPromises()
        expect(wmsData.value).toBeDefined()
        expect(wmsData.value?.capabilities).toBeDefined()

        const capabilities = wmsData.value?.capabilities
        // test a few samples
        expect(capabilities.version).toEqual('1.3.0')
        expect(capabilities.Service.Name).toEqual('WMS')
        expect(capabilities.Capability).toBeDefined()
        expect(capabilities.Capability.Layer).toBeDefined()
    })

    it('fetches the WMS capabilities after the service data becomes available late', async () => {
        const service = ref<Service | null>(null)
        const layerId = ref('ch.bafu.gewaesserschutz-biologischer_zustand_fische')
        const { wmsData } = useWmsCapabilities(service, layerId)

        expect(wmsData.value).toBeDefined()
        expect(wmsData.value.capabilities).toBe(null)
        expect(wmsData.value.dimensions).toBe(null)

        service.value = ChGeoadminWms as Service

        await flushPromises()
        expect(wmsData.value).toBeDefined()
        expect(wmsData.value?.capabilities).toBeDefined()

        const capabilities = wmsData.value?.capabilities
        // test a few samples
        expect(capabilities.version).toEqual('1.3.0')
        expect(capabilities.Service.Name).toEqual('WMS')
        expect(capabilities.Capability).toBeDefined()
        expect(capabilities.Capability.Layer).toBeDefined()
    })

    it('fetches the WMS capabilities after the layer ID becomes available late', async () => {
        const service = ref<Service | null>(ChGeoadminWms as Service)
        const layerId = ref<string | null>(null)
        const { wmsData } = useWmsCapabilities(service, layerId)

        expect(wmsData.value).toBeDefined()
        expect(wmsData.value.capabilities).toBe(null)
        expect(wmsData.value.dimensions).toBe(null)

        layerId.value = 'ch.bafu.gewaesserschutz-biologischer_zustand_fische'

        await flushPromises()
        expect(wmsData.value).toBeDefined()
        expect(wmsData.value?.capabilities).toBeDefined()

        const capabilities = wmsData.value?.capabilities
        // test a few samples
        expect(capabilities.version).toEqual('1.3.0')
        expect(capabilities.Service.Name).toEqual('WMS')
        expect(capabilities.Capability).toBeDefined()
        expect(capabilities.Capability.Layer).toBeDefined()
    })
})

describe('useWmsCapabilities parseWmsCapabilities', () => {
    it('extracts the capabilities', () => {
        const { capabilities, dimensions } = parseWmsCapabilities(
            capabilitiesXML,
            'ch.bafu.gewaesserschutz-biologischer_zustand_fische'
        )
        expect(capabilities.version).toEqual('1.3.0')
        expect(capabilities.Service.Name).toEqual('WMS')
        expect(capabilities.Capability).toBeDefined()
        expect(capabilities.Capability.Layer).toBeDefined()

        expect(dimensions).toEqual([
            {
                name: 'time',
                units: 'ISO8601',
                unitSymbol: null,
                default: null,
                multipleValues: undefined,
                nearestValue: false,
                current: undefined,
                values: '2012/2023',
            },
        ])
    })

    it('extracts the capabilities with a layer with no dimensions', () => {
        const { capabilities, dimensions } = parseWmsCapabilities(
            capabilitiesXML,
            'ch.bafu.alpweiden-herdenschutzhunde'
        )
        expect(capabilities.version).toEqual('1.3.0')
        expect(capabilities.Service.Name).toEqual('WMS')
        expect(capabilities.Capability).toBeDefined()
        expect(capabilities.Capability.Layer).toBeDefined()

        expect(dimensions).toEqual(null)
    })
})

describe('useWmsCapabilities 404', () => {
    const handlers = [
        http.get(
            'https://wms.geo.admin.ch/',
            // MSW doesn't allow query params in the request handler. Adding them here for reference:
            // ?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&FORMAT=text%2Fxml&lang=de
            () => {
                return HttpResponse.json('Not Found', { status: 404 })
            }
        ),
    ]
    const server = setupServer(...handlers)

    beforeAll(() => server.listen())

    afterAll(() => server.close())

    afterEach(() => server.resetHandlers())

    it("doesn't trip with 404", async () => {
        const service = ref<Service>(ChGeoadminWms as Service)
        const layerId = ref('ch.bafu.alpweiden-herdenschutzhunde')

        const { wmsData } = useWmsCapabilities(service, layerId)
        await flushPromises()
        expect(wmsData.value.capabilities).toBe(null)
    })
})
