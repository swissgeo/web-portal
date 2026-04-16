/**
 * Example *.nuxt.spec.ts — tests that genuinely need the Nuxt runtime.
 *
 * This file uses `mountSuspended` from @nuxt/test-utils/runtime to mount
 * a component inside a real Nuxt app. The component gets real i18n, real
 * router, real Pinia — no stubs. Use this pattern when the test verifies
 * that Nuxt-level configuration (i18n locales, runtime config, plugin
 * wiring) reaches the component correctly.
 *
 * For testing component logic in isolation, prefer *.spec.ts (happy-dom)
 * with `mockNuxtImport` stubs — it's faster and more focused.
 */
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

// A minimal component that reads from the real Nuxt i18n context.
// No stubs — useI18n() is the real composable provided by @nuxtjs/i18n.
const I18nProbe = defineComponent({
    setup() {
        const { locale, locales } = useI18n()
        return { locale, locales }
    },
    template: '<span>{{ locale }}</span>',
})

describe('Nuxt i18n integration', () => {
    it('provides the configured locales from nuxt.config.ts', async () => {
        const wrapper = await mountSuspended(I18nProbe)

        const codes = wrapper.vm.locales.map((l: { code: string }) => l.code)
        expect(codes).toContain('de')
        expect(codes).toContain('fr')
        expect(codes).toContain('en')
        expect(codes).toContain('it')
        expect(codes).toContain('rm')
    })

    it('defaults to the "de" locale', async () => {
        const wrapper = await mountSuspended(I18nProbe)

        expect(wrapper.vm.locale).toBe('de')
        expect(wrapper.text()).toBe('de')
    })
})
