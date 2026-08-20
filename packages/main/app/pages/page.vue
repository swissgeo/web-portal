<script lang="ts" setup>
import type { MenuTree, Page } from "@swissgeo/content";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";

import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";

const props = defineProps<{
  documentId?: string;
}>();

const route = useRoute();
const { locale } = useI18n();

const uiStore = useSidebarStore();
const contentStore = useContentStore();
const menuStore = useMenuStore();

const livingDocsPageData = useLivingdocsPageData();

const documentId = computed<string>(() => {
  if (props.documentId) {
    return props.documentId;
  }

  const routeDocumentId = route.params.documentId;
  if (typeof routeDocumentId === "string") {
    return routeDocumentId;
  }

  const metaDocumentId = route.meta.documentId;
  return typeof metaDocumentId === "string" ? metaDocumentId : "";
});

const { data } = await useFetch<Page>(
  // wrapping it in function to have it react to the documentId change
  () => `/api/wpa/v1/content/page/${documentId.value}`,
);

const containers = computed(() => {
  return data.value ? livingDocsPageData.getContainers(data.value) : [];
});

const getMenuForPage = (route: RouteLocationNormalizedLoadedGeneric) => {
  if (!menuStore.menuData) {
    return;
  }

  for (const menuId of Object.keys(menuStore.menuData)) {
    const menu = menuStore.menuData[menuId];

    const traverseMenu = (menu: MenuTree) => {
      for (const entry of menu) {
        const entryInLang = entry[locale.value];
        if (entryInLang) {
          if (entryInLang?.documentId === route.meta.documentId) {
            return true;
          }
        }

        if (entry.children) {
          traverseMenu(entry.children);
        }
      }

      return false;
    };

    if (!menu) {
      continue;
    }

    if (traverseMenu(menu)) {
      return menuId;
    }
  }
  return false;
};

const openContentSidebar = () => {
  const menuId = getMenuForPage(route);
  if (menuId) {
    const menuMetaData = menuStore.getMenuMetaDataById(parseInt(menuId));
    if (menuMetaData) {
      uiStore.setSidebar(SidebarType.CONTENT);
      menuStore.setCurrentMenuTree(menuMetaData);
    }
  }
};

onMounted(() => {
  openContentSidebar();
  if (data.value) {
    contentStore.setCurrentPageData(data.value);
  }
});
</script>

<template>
  <NuxtLayout>
    <div
      class="h-full overflow-x-hidden overflow-y-auto px-[15px] py-10 font-editorial md:px-8"
    >
      <ContentRenderer :containers="containers" />
    </div>
  </NuxtLayout>
</template>
