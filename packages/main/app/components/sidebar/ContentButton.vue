<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const { icon, menuMetaData } = defineProps<{
    icon: string
    menuMetaData: MenuMetaData
}>()

const interfaceStore = useUiStore()
const menuStore = useMenuStore()

const isCurrentMenuActive = computed(() => menuStore.currentMenuTree?.id === menuMetaData.id)

const isActive = computed(
    () =>
        route.path.startsWith('/content') &&
        isCurrentMenuActive.value &&
        interfaceStore.currentSidebar === SidebarType.CONTENT
)

const open = () => {
    if (
        isActive.value &&
        interfaceStore.currentSidebar === SidebarType.CONTENT &&
        isCurrentMenuActive
    ) {
        // closing it
        interfaceStore.closeSidebar()
    } else if (isActive.value) {
        interfaceStore.setSidebar(SidebarType.CONTENT)
        menuStore.setCurrentMenuTree(menuMetaData)
    } else {
        interfaceStore.setSidebar(SidebarType.CONTENT)
        menuStore.setCurrentMenuTree(menuMetaData)

        if (!route.path.startsWith('/content')) {
            router.push('/content')
        }
    }
}
</script>

<template>
    <SidebarButton
        :is-active="isActive"
        :title="$t('menu.projectInfo')"
        :icon="icon"
        @click="open"
    />
</template>
