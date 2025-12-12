<script setup lang="ts">
// const router = useRouter();

const uiStore = useUiStore();

const toggle = () => {
  if (
    uiStore.isSidebarOpen &&
    uiStore.currentSidebar === SidebarType.LAYER_CART
  ) {
    uiStore.closeSidebar();
  } else {
    uiStore.setSidebar(SidebarType.LAYER_CART);
  }
  //   router.push("/layerTree");
};
</script>

<template>
    <div class="relative inline-block">
        <!-- :is-active="uiStore.isSearchVisible" -->
        <SidebarButton
            :is-active="uiStore.currentSidebar == 'layerCart'"
            data-cy="button-search-panel"
            :title="$t('menu.search')"
            icon="Map"
            @click="toggle"
        />
    </div>
</template>
