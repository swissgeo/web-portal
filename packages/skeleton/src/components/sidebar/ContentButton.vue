<script setup lang="ts">
import { useMenuStore } from "@swissgeo/content";
import { useUiStore, SidebarType } from "@/stores/ui";
import { MenuMetaData } from "@swissgeo/content";

const { t: $t } = useI18n();

const router = useRouter();
const route = useRoute();

const { icon, menuMetaData } = defineProps<{
  icon: string;
  menuMetaData: MenuMetaData;
}>();

const uiStore = useUiStore();
const menuStore = useMenuStore();

const isCurrentMenuActive = computed(
  () => menuStore.currentMenuTree?.id === menuMetaData.id,
);

const isActive = computed(
  () =>
    route.path.startsWith("/content") &&
    isCurrentMenuActive.value &&
    uiStore.currentSidebar === SidebarType.CONTENT,
);

const open = () => {
  if (
    isActive.value &&
    uiStore.currentSidebar === SidebarType.CONTENT &&
    isCurrentMenuActive
  ) {
    // closing it
    uiStore.closeSidebar();
  } else if (isActive.value) {
    uiStore.setSidebar(SidebarType.CONTENT);
    menuStore.setCurrentMenuTree(menuMetaData);
  } else {
    uiStore.setSidebar(SidebarType.CONTENT);
    menuStore.setCurrentMenuTree(menuMetaData);

    if (!route.path.startsWith("/content")) {
      router.push("/content");
    }
  }
};
</script>

<template>
  <SidebarButton
    :is-active="isActive"
    :title="$t('menu.projectInfo')"
    :icon="icon"
    @click="open"
  />
</template>
