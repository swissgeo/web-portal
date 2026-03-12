import type { Layer } from '@/types/layers'

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MapFooterAttributionList from '../MapFooterAttributionList.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

function makeLayer(partial: Partial<Layer> = {}): Layer {
  return {
    type: 'WMTS',
    layerId: partial.layerId ?? 'layer-id',
    uuid: partial.uuid ?? crypto.randomUUID(),
    opacity: partial.opacity ?? 1,
    isVisible: partial.isVisible ?? true,
    zIndex: partial.zIndex ?? 1,
    info: partial.info,
  }
}

describe('MapFooterAttributionList.vue', () => {
  it('renders attributions for visible layers and visible background layer only', () => {
    const wrapper = mount(MapFooterAttributionList, {
      props: {
        layers: [
          makeLayer({
            layerId: 'visible-with-attribution',
            isVisible: true,
            info: { attribution: { title: 'Visible Source' } },
          }),
          makeLayer({
            layerId: 'hidden-with-attribution',
            isVisible: false,
            info: { attribution: { title: 'Hidden Source' } },
          }),
          makeLayer({
            layerId: 'visible-without-attribution',
            isVisible: true,
          }),
        ],
        backgroundLayer: makeLayer({
          layerId: 'background',
          isVisible: true,
          info: { attribution: { title: 'Background Source' } },
        }),
      },
    })

    expect(wrapper.text()).toContain('copyright_data')
    expect(wrapper.find('[data-cy="layer-copyright-Background Source"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="layer-copyright-Visible Source"]').exists()).toBe(true)
    expect(wrapper.find('[data-cy="layer-copyright-Hidden Source"]').exists()).toBe(false)
  })

  it('deduplicates attribution entries by title', () => {
    const wrapper = mount(MapFooterAttributionList, {
      props: {
        layers: [
          makeLayer({
            layerId: 'first',
            info: { attribution: { title: 'Duplicate Source' } },
          }),
          makeLayer({
            layerId: 'second',
            info: { attribution: { title: 'Duplicate Source' } },
          }),
        ],
        backgroundLayer: makeLayer({
          layerId: 'background',
          info: { attribution: { title: 'Duplicate Source' } },
        }),
      },
    })

    expect(wrapper.findAll('[data-cy="layer-copyright-Duplicate Source"]')).toHaveLength(1)
  })

  it('does not include background attribution when background layer is not visible', () => {
    const wrapper = mount(MapFooterAttributionList, {
      props: {
        layers: [],
        backgroundLayer: makeLayer({
          layerId: 'background',
          isVisible: false,
          info: { attribution: { title: 'Hidden Background Source' } },
        }),
      },
    })

    expect(wrapper.find('[data-cy="layer-copyright-Hidden Background Source"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('copyright_data')
  })
})
