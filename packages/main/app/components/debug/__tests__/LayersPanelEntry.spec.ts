import type { Layer } from '@swissgeo/layers'

import { mount } from '@vue/test-utils'
import LayersPanelEntry from '~/components/debug/LayersPanelEntry.vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

const { addLayerMock, makeServerLayerMock } = vi.hoisted(() => ({
    addLayerMock: vi.fn(),
    makeServerLayerMock: vi.fn(),
}))

vi.mock('@swissgeo/layers', () => ({
    useLayerStore: () => ({
        addLayer: addLayerMock,
    }),
    makeServerLayer: makeServerLayerMock,
}))

describe('LayersPanelEntry.vue', () => {
    beforeEach(() => {
        addLayerMock.mockReset()
        makeServerLayerMock.mockReset()
        vi.stubGlobal('computed', computed)

        makeServerLayerMock.mockImplementation(
            (dataset: {
                id: string
                properties?: { contacts?: Array<{ organisation?: string }>; attribution?: string }
            }) => {
                const contactOrganisation = dataset.properties?.contacts?.[0]?.organisation
                return {
                    humanId: dataset.id,
                    info: {
                        displayName: dataset.id,
                        attribution: {
                            title: contactOrganisation ?? dataset.properties?.attribution,
                        },
                    },
                } as Layer
            }
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('adds a layer using already mapped dataset attribution', async () => {
        const wrapper = mount(LayersPanelEntry, {
            props: {
                dataset: {
                    id: 'ch.layer.one',
                    links: [
                        {
                            rel: 'distributions',
                            href: 'https://example.test/distributions',
                            title: 'distributions',
                        },
                    ],
                    properties: {
                        type: 'Dataset',
                        title: 'Layer title',
                        attribution: 'OGC source',
                        preferredDistributionId: 'OGC:WMTS:ch.layer.one',
                        contacts: [
                            {
                                country: 'CH',
                                role: 'pointOfContact',
                                organisation: 'Catalog Contact Org',
                            },
                        ],
                    },
                } as never,
            },
        })

        await wrapper.find('button').trigger('click')

        expect(addLayerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                info: expect.objectContaining({
                    attribution: {
                        title: 'Catalog Contact Org',
                    },
                }),
            })
        )
    })
})
