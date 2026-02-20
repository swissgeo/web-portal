import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import type { Layer } from '@swissgeo/layers'

// vue-i18n is aliased to a stub in vitest.config.ts, so no manual mock needed.
// useBackgroundSelector's PNG imports resolve correctly via the ~ alias.

import BackgroundSelectorEntry from '~/components/map/BackgroundSelectorEntry.vue'
import type { VoidLayer } from '~/components/map/useBackgroundSelector'

const voidLayer: VoidLayer = 'void'
const mockLayer = {
    uuid: 'test-uuid',
    dataset: { id: 'ch.swisstopo.pixelkarte-farbe' },
} as unknown as Layer

describe('BackgroundSelectorEntry.vue', () => {
    describe('data-cy attribute', () => {
        it('is "void" for the void layer', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: voidLayer, isCurrent: false },
            })
            expect(wrapper.find('button').attributes('data-cy')).toBe('void')
        })

        it('is the layer uuid for a real layer', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: mockLayer, isCurrent: false },
            })
            expect(wrapper.find('button').attributes('data-cy')).toBe('test-uuid')
        })
    })

    describe('active class', () => {
        it('is present when isCurrent is true', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: voidLayer, isCurrent: true },
            })
            expect(wrapper.find('button').classes()).toContain('active')
        })

        it('is absent when isCurrent is false', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: voidLayer, isCurrent: false },
            })
            expect(wrapper.find('button').classes()).not.toContain('active')
        })
    })

    describe('folded class', () => {
        it('is present when folded prop is true', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: voidLayer, isCurrent: false, folded: true },
            })
            expect(wrapper.find('button').classes()).toContain('folded')
        })

        it('is absent by default', () => {
            const wrapper = mount(BackgroundSelectorEntry, {
                props: { backgroundLayer: voidLayer, isCurrent: false },
            })
            expect(wrapper.find('button').classes()).not.toContain('folded')
        })
    })

    it('renders a thumbnail image', () => {
        const wrapper = mount(BackgroundSelectorEntry, {
            props: { backgroundLayer: voidLayer, isCurrent: false },
        })
        expect(wrapper.find('img').exists()).toBe(true)
    })

    it('emits click when the button is clicked', async () => {
        const wrapper = mount(BackgroundSelectorEntry, {
            props: { backgroundLayer: voidLayer, isCurrent: false },
        })
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('emits click for every individual click', async () => {
        const wrapper = mount(BackgroundSelectorEntry, {
            props: { backgroundLayer: voidLayer, isCurrent: false },
        })
        await wrapper.find('button').trigger('click')
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('click')).toHaveLength(2)
    })
})
