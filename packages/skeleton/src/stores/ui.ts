import { defineStore } from "pinia";
import { ref, computed } from "vue";

const LAYER_CART_WIDTH = 347;
const GEOCATALOG_TREE_WIDTH = 1280;

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

  const isContentSidebarVisible = computed(
    () => currentSidebar.value === SidebarType.CONTENT,
  );

  const isLayerCartVisible = computed(
    () => currentSidebar.value === SidebarType.LAYER_CART,
  );

  const isGeocatalogTreeVisible = computed(
    () => currentSidebar.value === SidebarType.GEOCATALOG_TREE,
  );

  const sidebarContentWidth = computed(() =>
    isGeocatalogTreeVisible.value ? GEOCATALOG_TREE_WIDTH : LAYER_CART_WIDTH,
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
    isLayerCartVisible,
    isContentSidebarVisible,
    isGeocatalogTreeVisible,
    sidebarContentWidth,

    // actions
    setSidebar,
    closeSidebar,
  };
});
