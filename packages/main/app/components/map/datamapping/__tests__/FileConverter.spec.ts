import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FileConverter from '../FileConverter.vue'

describe('FileConverter', () => {
    it('maps the data correctly', async () => {
        const layerData = {
            data: `<xml>KML data here</xml>`,
            type: 'kml' as const,
            uuid: 'kml-is-a-snowflake',
            humanId: 'K to the M to the L',
            isVisible: false,
            opacity: 0,
            isLoading: false,
        }
        const wrapper = mount(FileConverter, {
            props: {
                layer: layerData,
                zIndex: 1,
            },
        })

        const updateEvents = wrapper.emitted('update')

        expect(wrapper.emitted('update')).toHaveLength(1)
        expect(updateEvents![0]).toEqual([
            {
                ...layerData,
                format: 'KML',
                layerId: 'K to the M to the L',
                zIndex: 1,
            },
        ])

        await wrapper.setProps({
            layer: {
                ...layerData,
                isVisible: true,
            },
            zIndex: 1,
        })
        expect(updateEvents).toHaveLength(2)
        expect(updateEvents![1]![0]).toHaveProperty('isVisible', true)

        // going back to visible = false
        await wrapper.setProps({
            layer: layerData,
            zIndex: 1,
        })
        expect(updateEvents).toHaveLength(3)
        expect(updateEvents![2]![0]).toHaveProperty('isVisible', false)

        await wrapper.setProps({
            layer: {
                ...layerData,
            },
            zIndex: 2,
        })
        expect(updateEvents).toHaveLength(4)
        expect(updateEvents![3]![0]).toHaveProperty('zIndex', 2)
    })

    it('emits the remove signal when unmounted', () => {
        const layerData = {
            data: `<xml>KML data here</xml>`,
            type: 'kml' as const,
            uuid: 'kml-is-a-snowflake',
            humanId: 'K to the M to the L',
            isVisible: false,
            opacity: 0,
            isLoading: false,
        }
        const wrapper = mount(FileConverter, {
            props: {
                layer: layerData,
                zIndex: 1,
            },
        })

        wrapper.unmount()
        expect(wrapper.emitted('remove')).toHaveLength(1)
    })
})
