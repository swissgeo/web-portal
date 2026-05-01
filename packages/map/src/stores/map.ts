import type { Map as OlMapType } from 'ol'

import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useMapStore = defineStore('map', () => {
    const olMap = shallowRef<OlMapType | null>(null)
    const isMapLoaded = ref(false)

    function setOlMap(map: OlMapType) {
        olMap.value = map
    }

    function setIsMapLoaded() {
        isMapLoaded.value = true
    }

    return {
        olMap,
        setOlMap,
        setIsMapLoaded,
        isMapLoaded,
    }
})
