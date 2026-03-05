import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarLanguageSwitcherButton from '~/components/sidebar/SidebarLanguageSwitcherButton.vue'

const mockApplyLocale = vi.fn()
const mockLocale = ref('de')
const mockLocales = ref([
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
])

vi.stubGlobal('useI18n', () => ({ locale: mockLocale, locales: mockLocales }))
vi.stubGlobal('useAppStore', () => ({ applyLocale: mockApplyLocale }))

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
        mockLocale.value = 'de'
        vi.clearAllMocks()
    })

    it('calls applyLocale when the user selects a different locale', async () => {
        const wrapper = mountComponent()
        await nextTick()

        await wrapper.find('button').trigger('click')
        await nextTick()

        expect(mockApplyLocale).toHaveBeenCalledWith('fr')
    })

    it('does not call applyLocale when the selected locale is already active', async () => {
        // ULocaleSelectStub always emits 'fr', so set locale to 'fr' to match
        mockLocale.value = 'fr'
        const wrapper = mountComponent()
        await nextTick()

        await wrapper.find('button').trigger('click')
        await nextTick()

        expect(mockApplyLocale).not.toHaveBeenCalled()
    })

    it('does not call applyLocale when locale changes externally (selectedLocale stays in sync)', async () => {
        mountComponent()
        await nextTick()

        mockLocale.value = 'fr'
        await nextTick()

        // The locale watcher syncs selectedLocale to 'fr', so the selectedLocale watcher
        // sees value === locale.value and skips the applyLocale call.
        expect(mockApplyLocale).not.toHaveBeenCalled()
    })

    it('logs an error when applyLocale throws', async () => {
        mockApplyLocale.mockRejectedValueOnce(new Error('navigation failed'))

        const wrapper = mountComponent()
        await nextTick()

        await wrapper.find('button').trigger('click')
        await nextTick()

        const log = (await import('@swissgeo/log')).default
        expect(log.error).toHaveBeenCalled()
    })
})
