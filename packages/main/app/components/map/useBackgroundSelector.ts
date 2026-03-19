import type { Layer } from '@swissgeo/layers'

import pixelkarteFarbeUrl from '~/assets/backgroundLayersImages/ch.swisstopo.pixelkarte-farbe.png'
import pixelkarteGrauUrl from '~/assets/backgroundLayersImages/ch.swisstopo.pixelkarte-grau.png'
import swissImageUrl from '~/assets/backgroundLayersImages/ch.swisstopo.swissimage.png'
import voidUrl from '~/assets/backgroundLayersImages/void.png'
import { ref } from 'vue'

/**
 * Centralisation of the logic behind the background selector. This helps us define two flavors of
 * background selector with the same Vue code basis.
 */
export default function useBackgroundSelector(
    selectBackgroundCallback: (backgroundLayer: Layer | null) => void
) {
    const selectorOpen = ref<boolean>(false)

    function getImageForBackgroundLayer(backgroundLayer?: Layer | null) {
        if (!backgroundLayer) {
            return voidUrl
        }

        if (!backgroundLayer.data || typeof backgroundLayer.data === 'string') {
            throw new Error('something wrong with the background layer')
        }

        const layerData = backgroundLayer.data

        const backgroundId = layerData.id
        switch (backgroundId) {
            case 'ch.swisstopo.pixelkarte-farbe':
                return pixelkarteFarbeUrl
            case 'ch.swisstopo.pixelkarte-grau':
                return pixelkarteGrauUrl
            case 'ch.swisstopo.swissimage':
                return swissImageUrl
        }
    }

    function onSelectBackground(backgroundLayer: Layer | null) {
        selectBackgroundCallback(backgroundLayer)
        selectorOpen.value = false
    }

    function toggleShowSelector() {
        selectorOpen.value = !selectorOpen.value
    }

    return {
        selectorOpen,
        getImageForBackgroundLayer,
        onSelectBackground,
        toggleShowSelector,
    }
}
