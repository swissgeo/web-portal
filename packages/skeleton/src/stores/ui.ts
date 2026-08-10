import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const SIDEBAR_CONTENT_WIDTH = 400;
/** Width of the tab left over on the map once the sidebar is collapsed */
export const SIDEBAR_HANDLE_WIDTH = 24;

// Sidebar types enum
export enum SidebarType {
  LAYER_CART = "layerCart",
  GEOCATALOG_TREE = "geocatalogTree",
  CONTENT = "content",
}

export const useSidebarStore = defineStore("sidebar", () => {
  const isWelcomeOverlayVisible = ref(false);
  const helpOverlayContentId = ref<number | null>(null);
  const currentSidebar = ref<SidebarType | null>(null);

  // #region: getters
  const isSidebarOpen = computed(() => currentSidebar.value !== null);

  const sidebarWidth = computed(() =>
    isSidebarOpen.value ? SIDEBAR_CONTENT_WIDTH : SIDEBAR_HANDLE_WIDTH,
  );

  const isContentSidebarVisible = computed(
    () => currentSidebar.value === SidebarType.CONTENT,
  );

  const isLayerCartVisible = computed(
    () => currentSidebar.value === SidebarType.LAYER_CART,
  );

  // #endregion

  function setSidebar(type: SidebarType) {
    currentSidebar.value = type;
  }

  function closeSidebar() {
    currentSidebar.value = null;
  }

  return {
    currentSidebar,
    helpOverlayContentId,

    // getters
    isWelcomeOverlayVisible,
    isSidebarOpen,
    sidebarWidth,
    isLayerCartVisible,
    isContentSidebarVisible,

    // actions
    setSidebar,
    closeSidebar,
  };
});
