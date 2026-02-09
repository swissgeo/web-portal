import { ULocaleSelect } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ULocaleSelect', ULocaleSelect)
})
