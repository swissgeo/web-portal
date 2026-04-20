import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { AttributionSource } from '@swissgeo/map'

import MapFooterAttributionList from '~/components/map/MapFooterAttributionList.vue'

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}))

describe('MapFooterAttributionList.vue', () => {
    it('renders provided sources', () => {
        const sources: AttributionSource[] = [
            { id: 'source-a', name: 'Source A', url: 'https://example.com/a' },
            { id: 'source-b', name: 'Source B' },
        ]

        const wrapper = mount(MapFooterAttributionList, { props: { sources } })

        expect(wrapper.find('[data-cy="layers-copyrights"]').exists()).toBe(true)
        expect(wrapper.find('[data-cy="layer-copyright-Source A"]').exists()).toBe(true)
        expect(wrapper.find('[data-cy="layer-copyright-Source B"]').exists()).toBe(true)
    })

    it('renders nothing when sources is empty', () => {
        const wrapper = mount(MapFooterAttributionList, { props: { sources: [] } })

        expect(wrapper.find('[data-cy="layers-copyrights"]').exists()).toBe(false)
    })

    it('renders last item without trailing comma', () => {
        const sources: AttributionSource[] = [
            { id: 'source-a', name: 'Source A' },
            { id: 'source-b', name: 'Source B' },
        ]

        const wrapper = mount(MapFooterAttributionList, { props: { sources } })

        const items = wrapper.findAll('[data-cy^="layer-copyright-"]')
        expect(items[0]!.text()).toContain(',')
        expect(items[1]!.text()).not.toContain(',')
    })
})
