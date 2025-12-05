<script setup lang="ts">
const router = useRouter()

const interfaceStore = useUiStore()

const toggleSearch = () => {
    interfaceStore.setSidebar(SidebarType.LAYER_CART)
    router.push('/layerTree')
}
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="interfaceStore.currentSidebar == 'layerCart'"
            data-cy="button-search-panel"
            :title="$t('menu.search')"
            icon="Map"
            @click="toggleSearch"
        />
    </div>
</template>
