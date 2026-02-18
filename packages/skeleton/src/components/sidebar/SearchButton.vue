<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// const router = useRouter()
import SidebarButton from '@/components/sidebar/SidebarButton.vue'
import { useSidebarStore, SidebarType } from '@/stores/ui'

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
            icon="Search"
            @click="toggleSearch"
        />
    </div>
</template>
