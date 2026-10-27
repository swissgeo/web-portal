import { defineStore } from "pinia";
import { ref, computed } from "vue";

const LAYER_CART_WIDTH = 347;

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

  // in the current state, the sidebar width can't be changed. We keep it as a computed for the following reasons:
  // 1. the store getters are all computed, we enforce this to be used the same way as others
  // 2. if one day we need to add reactivity again, there is no need to change the code elsewhere.
  const sidebarContentWidth = computed(() => LAYER_CART_WIDTH);

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
