import { mount } from '@vue/test-utils'
import Panel from '~/components/debug/Panel.vue'
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
      openLayersPanel: "Ouvrir le panneau des couches",
      openImportLayersPanel: "Ouvrir le panneau d'importation des couches",
      openImportLocalLayersPanel: "Ouvrir le panneau d'importation des couches locales",
      openDrawingPanel: "Ouvrir le panneau de dessin",
    },
  },
}

describe('Panel.vue - i18n integration', () => {
  it('shows English texts initially and updates to French after locale change', async () => {
    // simple inline i18n plugin to avoid external dependency in tests
    const i18nPlugin = {
      install(app: any) {
        const locale = ref('en')
        app.config.globalProperties.$t = (path: string) => {
          const parts = path.split('.')
          let v: any = messages[locale.value]
          for (const p of parts) {
            v = v?.[p]
          }
          return v ?? path
        }
        app.config.globalProperties.$setLocale = (l: string) => {
          locale.value = l
        }
      },
    }

    const wrapper = mount({
      components: { Panel },
      template: '<div><Panel /></div>',
    }, {
      global: {
        plugins: [i18nPlugin],
      },
    })

    // initial texts should be English
    expect(wrapper.text()).toContain('Open Drawing Panel')

      // simulate language switch via global helper
      ; (wrapper.vm as any).$setLocale('fr')
    await nextTick()

    // texts should update to French
    expect(wrapper.text()).toContain('Ouvrir le panneau de dessin')
    expect(wrapper.text()).toContain('Ouvrir le panneau des couches')
  })
})
