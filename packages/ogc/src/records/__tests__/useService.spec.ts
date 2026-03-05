import { useFetch } from '@vueuse/core'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { Distribution } from '@/types/Records'

import { useService, extractServiceUrl } from '../useService'
import ChGeoadminWmts from './fixtures/ch.admin.geo.wmts.json'
import ChBafuSchutzgebieteLuftfahrtWmts from './fixtures/ch.bafu.schutzgebiete-luftfahrt:wmts.distribution.json'

vi.mock('@vueuse/core', () => ({
    useFetch: vi.fn(),
}))

describe('useDistributionCollection', () => {
    const distribution = ref(ChBafuSchutzgebieteLuftfahrtWmts as Distribution)

    it.skip('extracts the service URL from the distribution', () => {
        const url = extractServiceUrl(distribution.value)
        expect(url).toEqual(
            'https://services.dev.sgdi.tech/api/oar/v0/collections/geoadmin.services/items/ch.admin.geo.wmts'
        )
    })

    it.skip('fetches the service data', () => {
        // @ts-expect-error 2345
        vi.mocked(useFetch).mockReturnValue({
            data: ref(ChGeoadminWmts),
            isFinished: ref(true),
        })

        const { serviceData } = useService(distribution)
        expect(serviceData.value).toEqual(ChGeoadminWmts)
    })
})
