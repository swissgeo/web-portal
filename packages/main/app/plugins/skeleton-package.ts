import type { Component } from 'vue'

import { ULocaleSelect, UButton, UInput, UPopover } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ULocaleSelect', ULocaleSelect)
    nuxtApp.vueApp.component('UButton', UButton)
    // UInput is typed as a generic/callable component by @nuxt/ui —
    // TS doesn't consider that a `Component`, so we cast via `unknown`.
    nuxtApp.vueApp.component('UInput', UInput as unknown as Component)
    nuxtApp.vueApp.component('UPopover', UPopover as unknown as Component)
})
