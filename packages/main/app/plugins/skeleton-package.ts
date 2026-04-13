import type { Component } from 'vue'

import {
    ULocaleSelect,
    UButton,
    UInput,
    ULink,
    UPopover,
    USlider,
    UIcon,
    USeparator,
    UTabs,
    USkeleton,
    USlideover,
} from '#components'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ULocaleSelect', ULocaleSelect)
    nuxtApp.vueApp.component('UButton', UButton)
    nuxtApp.vueApp.component('ULink', ULink as Component)
    nuxtApp.vueApp.component('USeparator', USeparator)
    nuxtApp.vueApp.component('UIcon', UIcon as Component)
    nuxtApp.vueApp.component('UTabs', UTabs as Component)
    nuxtApp.vueApp.component('USkeleton', USkeleton as Component)
    nuxtApp.vueApp.component('USlideover', USlideover as Component)

    // UInput is typed as a generic/callable component by @nuxt/ui —
    // TS doesn't consider that a `Component`, so we cast via `unknown`.
    nuxtApp.vueApp.component('UInput', UInput as unknown as Component)
    nuxtApp.vueApp.component('UPopover', UPopover as unknown as Component)
    nuxtApp.vueApp.component('USlider', USlider as Component)
})
