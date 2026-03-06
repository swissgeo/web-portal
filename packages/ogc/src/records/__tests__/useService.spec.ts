import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Distribution } from '@/types/Records'

import { useService, extractServiceUrl } from '../useService'
import ChBafuSchutzgebieteLuftfahrtWmts from './fixtures/distribution_ch.bafu.schutzgebiete-luftfahrt:wmts.json'
import ChGeoadminWmts from './fixtures/service_ch.admin.geo.wmts.json'

describe('useService fetching the service data from the OGC records', () => {
    const handlers = [
        http.get(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/geoadmin.services/items/ch.admin.geo.wmts',
            () => {
                return HttpResponse.json(ChGeoadminWmts)
            }
        ),
    ]
    const server = setupServer(...handlers)

    beforeEach(() => server.listen())

    afterAll(() => server.close())

    afterEach(() => server.resetHandlers())

    it('fetches the service data', async () => {
        const distribution = ref(ChBafuSchutzgebieteLuftfahrtWmts as Distribution)
        const { serviceData } = useService(distribution)

        await flushPromises()
        expect(serviceData.value).toEqual(ChGeoadminWmts)
    })
})

describe('extract service URL', () => {
    it.skip('extracts the URL correctly', () => {
        const url = extractServiceUrl(distribution.value)
        expect(url).toEqual(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/geoadmin.services/items/ch.admin.geo.wmts'
        )
    })
})
