import { storeToRefs } from 'pinia'
import { onBeforeUnmount, ref, watch } from 'vue'

import { useMapStore } from '../stores/map'
import { useMap } from './useMap.composable'

export function usePrintFraming() {
    const { zoomLevel, olMap, center, viewportExtent } = useMap()
    const isEnabled = ref(false)

    watch(isEnabled, (enabled) => {
        console.log('isEnabled watched', enabled);
        
        if (enabled) {
            enable()
        } else {
            disable()
        }
    })

    function enable() {

        if (!olMap.value) {
            return
        }

        const view = olMap.value.getView()
        view.setConstrainResolution(true)      
    }


    function disable() {
        if (!olMap.value) {
            return
        }

        const view = olMap.value.getView()
        view.setConstrainResolution(false)
    }

    // onMounted(() => {

    // })

    onBeforeUnmount(() => {
        console.log('unmounting print framing composable...');
        disable()
    })

    return {
        isEnabled,
    }
}