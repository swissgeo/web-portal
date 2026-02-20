import type { App, ComponentPublicInstance } from 'vue'

import { mount } from '@vue/test-utils'
import Panel from '~/components/debug/Panel.vue'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

const messages = {
    en: {
        debug: {
            openLayersPanel: 'Open Layers Panel',
            openImportLayersPanel: 'Open Import Layers Panel',
            openImportLocalLayersPanel: 'Open Import Local Layers Panel',
            openDrawingPanel: 'Open Drawing Panel',
        },
    },
    fr: {
        debug: {
            openLayersPanel: 'Ouvrir le panneau des couches',
            openImportLayersPanel: "Ouvrir le panneau d'importation des couches",
            openImportLocalLayersPanel: "Ouvrir le panneau d'importation des couches locales",
            openDrawingPanel: 'Ouvrir le panneau de dessin',
        },
    },
}

type Locale = keyof typeof messages

function resolveMessage(locale: Locale, path: string): string {
    const parts = path.split('.')
    let value: unknown = messages[locale]

    for (const part of parts) {
        if (typeof value !== 'object' || value === null || !(part in value)) {
            return path
        }
        value = (value as Record<string, unknown>)[part]
    }

    return typeof value === 'string' ? value : path
}

type PanelTestVm = ComponentPublicInstance & {
    $setLocale: (_locale: Locale) => void
}

describe('Panel.vue - i18n integration', () => {
    it('shows English texts initially and updates to French after locale change', async () => {
        // simple inline i18n plugin to avoid external dependency in tests
        const i18nPlugin = {
            install(app: App) {
                const locale = ref('en')
                app.config.globalProperties.$t = (path: string) =>
                    resolveMessage(locale.value as Locale, path)
                app.config.globalProperties.$setLocale = (nextLocale: Locale) => {
                    locale.value = nextLocale
                }
            },
        }

        const wrapper = mount(
            {
                components: { Panel },
                template: '<div><Panel /></div>',
            },
            {
                global: {
                    plugins: [i18nPlugin],
                },
            }
        )

        // initial texts should be English
        expect(wrapper.text()).toContain('Open Drawing Panel')

        // simulate language switch via global helper
        ;(wrapper.vm as unknown as PanelTestVm).$setLocale('fr')
        await nextTick()

        // texts should update to French
        expect(wrapper.text()).toContain('Ouvrir le panneau de dessin')
        expect(wrapper.text()).toContain('Ouvrir le panneau des couches')
    })
})
