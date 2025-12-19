<script setup lang="ts">
// const router = useRouter();
import SidebarButton from '@/components/sidebar/SidebarButton.vue'
import { useUiStore, SidebarType } from '@/stores/ui'

const uiStore = useUiStore()

const { t: $t } = useI18n()

const toggle = () => {
    if (uiStore.isSidebarOpen && uiStore.currentSidebar === SidebarType.LAYER_CART) {
        uiStore.closeSidebar()
    } else {
        uiStore.setSidebar(SidebarType.LAYER_CART)
    }
    //   router.push("/layerTree");
}
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="uiStore.currentSidebar == 'layerCart'"
            data-cy="button-search-panel"
            :title="$t('menu.layerCart')"
            icon="Map"
            @click="toggle"
        />
    </div>
</template>
