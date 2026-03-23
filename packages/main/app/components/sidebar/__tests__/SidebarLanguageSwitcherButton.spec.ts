import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mount, flushPromises } from '@vue/test-utils'
import SidebarLanguageSwitcherButton from '~/components/sidebar/SidebarLanguageSwitcherButton.vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { locale, locales, mockApplyLocale } = vi.hoisted(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ref } = require('vue')
    return {
        locale: ref('de'),
        locales: ref([
            { code: 'de', name: 'Deutsch', dir: 'ltr' },
            { code: 'fr', name: 'Français', dir: 'ltr' },
        ]),
        mockApplyLocale: vi.fn(),
    }
})

vi.mock('@/stores/app', () => ({
    useAppStore: vi.fn(() => ({
        applyLocale: mockApplyLocale,
    })),
}))

mockNuxtImport('useI18n', () => {
    return () => ({
        t: vi.fn((key: string) => key),
        locale,
        locales,
    })
})

vi.mock('@swissgeo/log', () => ({
    default: { error: vi.fn() },
    LogPreDefinedColor: { Rose: 'rose' },
}))

// Stub ULocaleSelect so we can trigger locale changes without the full Nuxt UI component
const ULocaleSelectStub = {
    props: ['modelValue', 'locales'],
    emits: ['update:modelValue'],
    template: `<button @click="$emit('update:modelValue', 'fr')">switch</button>`,
}

function mountComponent() {
    return mount(SidebarLanguageSwitcherButton, {
        global: { stubs: { ULocaleSelect: ULocaleSelectStub } },
    })
}

describe('SidebarLanguageSwitcherButton', () => {
    beforeEach(() => {
        locale.value = 'de'
        vi.clearAllMocks()
    })

    it('calls applyLocale when the user selects a different locale', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        await wrapper.find('button').trigger('click')
        await flushPromises()

        expect(mockApplyLocale).toHaveBeenCalledWith('fr')
    })

    it('does not call applyLocale when the selected locale is already active', async () => {
        // ULocaleSelectStub always emits 'fr', so set locale to 'fr' to match
        locale.value = 'fr'
        const wrapper = mountComponent()
        await flushPromises()

        await wrapper.find('button').trigger('click')
        await flushPromises()

        expect(mockApplyLocale).not.toHaveBeenCalled()
    })

    it('does not call applyLocale when locale changes externally (selectedLocale stays in sync)', async () => {
        mountComponent()
        await flushPromises()

        locale.value = 'fr'
        await flushPromises()

        // The locale watcher syncs selectedLocale to 'fr', so the selectedLocale watcher
        // sees value === locale.value and skips the applyLocale call.
        expect(mockApplyLocale).not.toHaveBeenCalled()
    })

    it('logs an error when applyLocale throws', async () => {
        mockApplyLocale.mockRejectedValueOnce(new Error('navigation failed'))

        const wrapper = mountComponent()
        await flushPromises()

        await wrapper.find('button').trigger('click')
        await flushPromises()

        const log = (await import('@swissgeo/log')).default
        expect(log.error).toHaveBeenCalled()
    })
})
