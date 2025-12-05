import type { App } from 'vue'

import LucideIcon from '@/components/LucideIcon.vue'
import SearchButton from '@/components/sidebar/SearchButton.vue'

import SidebarContentButton from './components/sidebar/ContentButton.vue'

export default {
    install(app: App) {
        // TODO probably some namespacing would be good here
        app.component('LucideIcon', LucideIcon)

        app.component('SearchPanelButton', SearchButton)
        app.component('SidebarContentButton', SidebarContentButton)
    },
}

export { useUiStore } from '@/stores/ui'
