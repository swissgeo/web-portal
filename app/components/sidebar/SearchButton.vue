<script setup lang="ts">
const router = useRouter()

const interfaceStore = useInterfaceStore()

const toggleSearch = () => {
    console.log('Toggling search')
    interfaceStore.setSidebar(SidebarType.SEARCH)
    router.push('/search')
}
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="interfaceStore.currentSidebar == 'search'"
            data-cy="button-search-panel"
            :title="$t('menu.search')"
            icon="Search"
            @click="toggleSearch"
        />
    </div>
</template>
