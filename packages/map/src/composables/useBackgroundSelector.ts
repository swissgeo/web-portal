import type { ServerLayer } from '@swissgeo/layers'

import pixelkarteFarbeUrl from '@/assets/ch.swisstopo.pixelkarte-farbe.png'
import pixelkarteGrauUrl from '@/assets/ch.swisstopo.pixelkarte-grau.png'
import swissImageUrl from '@/assets/ch.swisstopo.swissimage.png'
import voidUrl from '@/assets/void.png'

export type VoidLayer = 'void'

/**
 * Centralisation of the logic behind the background selector. This helps us define two flavors of
 * background selector with the same Vue code basis.
 */
export default function useBackgroundSelector(
    selectBackgroundCallback: (backgroundLayer: ServerLayer | VoidLayer) => void
) {
    const selectorOpen = ref<boolean>(false)
    const animate = ref<boolean>(false)

    function getImageForBackgroundLayer(backgroundLayer?: ServerLayer | VoidLayer) {
        let backgroundId
        if (backgroundLayer === 'void') {
            backgroundId = 'void'
        }
        backgroundId = backgroundLayer?.record?.id || 'void'
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

    function onSelectBackground(backgroundLayer: ServerLayer | VoidLayer) {
        selectBackgroundCallback(backgroundLayer)
        toggleShowSelector()
    }

    function toggleShowSelector() {
        selectorOpen.value = !selectorOpen.value

        animate.value = true
        // waiting a short time, so that the animation can kick in, them remove the flag
        setTimeout(() => {
            animate.value = false
        }, 5000)
    }

    return {
        selectorOpen,
        animate,
        getImageForBackgroundLayer,
        onSelectBackground,
        toggleShowSelector,
    }
}
