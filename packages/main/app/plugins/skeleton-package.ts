import { ULocaleSelect, UButton, UInput } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ULocaleSelect', ULocaleSelect)
    nuxtApp.vueApp.component('UButton', UButton)
    nuxtApp.vueApp.component('UInput', UInput)
})
