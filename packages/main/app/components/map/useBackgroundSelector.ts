import type { Layer } from '@swissgeo/layers'

import pixelkarteFarbeUrl from '@/assets/backgroundLayersImages/ch.swisstopo.pixelkarte-farbe.png'
import pixelkarteGrauUrl from '@/assets/backgroundLayersImages/ch.swisstopo.pixelkarte-grau.png'
import swissImageUrl from '@/assets/backgroundLayersImages/ch.swisstopo.swissimage.png'
import voidUrl from '@/assets/backgroundLayersImages/void.png'

export type VoidLayer = 'void'

/**
 * Centralisation of the logic behind the background selector. This helps us define two flavors of
 * background selector with the same Vue code basis.
 */
export default function useBackgroundSelector(
    selectBackgroundCallback: (backgroundLayer: Layer | VoidLayer) => void
) {
    const selectorOpen = ref<boolean>(false)

    function getImageForBackgroundLayer(backgroundLayer?: Layer | VoidLayer) {
        let backgroundId
        if (backgroundLayer === 'void') {
            backgroundId = 'void'
        } else {
            backgroundId = backgroundLayer?.dataset?.id || 'void'
        }
        switch (backgroundId) {
            case 'ch.swisstopo.pixelkarte-farbe':
                return pixelkarteFarbeUrl
            case 'ch.swisstopo.pixelkarte-grau':
                return pixelkarteGrauUrl
            case 'ch.swisstopo.swissimage':
                return swissImageUrl
            case 'void':
            default:
                return voidUrl
        }
    }

    function onSelectBackground(backgroundLayer: Layer | VoidLayer) {
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
