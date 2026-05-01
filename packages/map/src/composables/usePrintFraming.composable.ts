
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, ref, watch } from 'vue'

import { useMapStore } from '../stores/map'

export function usePrintFraming() {
    const mapStore = useMapStore()
    const { olMap } = storeToRefs(mapStore)
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

        // adjust the zoom to its nearest integer value
        view.setZoom(Math.round(view.getZoom()))
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
