import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const SIDEBAR_ICON_WIDTH = 64 // min-w-16 = 4rem = 64px
export const SIDEBAR_CONTENT_WIDTH = 400

// Sidebar types enum
export enum SidebarType {
    LAYER_CART = 'layerCart',
    GEOCATALOG_TREE = 'geocatalogTree',
    SEARCH = 'search',
    CONTENT = 'content',
}

export const useSidebarStore = defineStore('sidebar', () => {
    const isWelcomeOverlayVisible = ref(false)
    const helpOverlayContentId = ref<number | null>(null)
    const currentSidebar = ref<SidebarType | null>(null)

    // #region: getters
    const isSidebarOpen = computed(() => currentSidebar.value !== null)

    const sidebarWidth = computed(() =>
        isSidebarOpen.value ? SIDEBAR_ICON_WIDTH + SIDEBAR_CONTENT_WIDTH : SIDEBAR_ICON_WIDTH
    )

    const isSearchVisible = computed(() => currentSidebar.value === SidebarType.SEARCH)

    const isContentSidebarVisible = computed(() => currentSidebar.value === SidebarType.CONTENT)

    const isLayerCartVisible = computed(() => currentSidebar.value === SidebarType.LAYER_CART)

    // #endregion

    function setSidebar(type: SidebarType) {
        currentSidebar.value = type
    }

    function closeSidebar() {
        currentSidebar.value = null
    }

    return {
        currentSidebar,
        helpOverlayContentId,

        // getters
        isWelcomeOverlayVisible,
        isSidebarOpen,
        sidebarWidth,
        isSearchVisible,
        isLayerCartVisible,
        isContentSidebarVisible,

        // actions
        setSidebar,
        closeSidebar,
    }
})
