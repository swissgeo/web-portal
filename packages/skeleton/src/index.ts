// make the ambient types known to esbuild
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as Types from '@swissgeo/shared/ambient'

import LucideIcon from '@/components/LucideIcon.vue'
import SearchButton from '@/components/sidebar/SearchButton.vue'

import IconButton from './components/IconButton.vue'
import ContentButton from './components/sidebar/ContentButton.vue'
import LanguageSwitcherButton from './components/sidebar/LanguageSwitcherButton.vue'
import SideBar from './components/sidebar/SideBar.vue'

export * from './stores/ui'
export * from './stores/search'

export { SideBar, SearchButton, LucideIcon, ContentButton, IconButton, LanguageSwitcherButton }

// export * from 'primevue'
