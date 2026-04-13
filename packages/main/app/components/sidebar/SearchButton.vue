<script setup lang="ts">
import { useSidebarStore, SidebarType } from '@swissgeo/skeleton'
import { useI18n } from 'vue-i18n'

// const router = useRouter()
import SidebarButton from '@/components/sidebar/SidebarButton.vue'

const { t: $t } = useI18n()

const uiStore = useSidebarStore()

const toggleSearch = () => {
    if (uiStore.isSidebarOpen && uiStore.currentSidebar === SidebarType.SEARCH) {
        uiStore.closeSidebar()
    } else {
        uiStore.setSidebar(SidebarType.SEARCH)
    }

    // router.push('/search')
}
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="uiStore.currentSidebar == 'search'"
            data-cy="button-search-panel"
            :title="$t('menu.search')"
            iconName="Search"
            @click="toggleSearch"
        />
    </div>
</template>
