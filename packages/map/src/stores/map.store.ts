import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', {
    state: () => ({
        printMode: false,
    }),
})
