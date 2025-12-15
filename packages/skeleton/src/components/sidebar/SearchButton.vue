<script setup lang="ts">
import { useUiStore, SidebarType } from '@/stores/ui'

import SidebarButton from './SidebarButton.vue'

const router = useRouter()

const { t: $t } = useI18n()

const uiStore = useUiStore()

const toggleSearch = () => {
    uiStore.setSidebar(SidebarType.SEARCH)
    router.push('/search')
}
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="uiStore.currentSidebar == 'search'"
            data-cy="button-search-panel"
            :title="$t('menu.search')"
            icon="Search"
            @click="toggleSearch"
        />
    </div>
</template>
