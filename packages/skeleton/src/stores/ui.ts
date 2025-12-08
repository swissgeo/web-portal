import { computed, ref } from "vue";

// Sidebar types enum
export enum SidebarType {
  LAYER_CART = "layerCart",
  GEOCATALOG_TREE = "geocatalogTree",
  SEARCH = "search",
  CONTENT = "content",
}

export const useUiStore = defineStore("uiStore", () => {
  const isWelcomeOverlayVisible = ref(false);
  const helpOverlayContentId = ref<number | null>(null);
  const currentSidebar = ref<SidebarType | null>(null);

  // #region: getters
  const isSidebarOpen = computed(() => currentSidebar.value !== null);

  const isSearchVisible = computed(
    () => currentSidebar.value === SidebarType.SEARCH
  );

  const isContentSidebarVisible = computed(
    () => currentSidebar.value === SidebarType.CONTENT
  );

  const isLayerCartVisible = computed(
    () => currentSidebar.value === SidebarType.LAYER_CART
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
    isSearchVisible,
    isLayerCartVisible,
    isContentSidebarVisible,

    // actions
    setSidebar,
    closeSidebar,
  };
});
