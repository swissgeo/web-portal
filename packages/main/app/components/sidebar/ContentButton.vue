<script setup lang="ts">
import type { MenuMetaData } from '@swissgeo/content'

import { useMenuStore } from '@swissgeo/content'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useSidebarStore, SidebarType } from '@/stores/ui'

import SidebarButton from './SidebarButton.vue'

const { t: $t } = useI18n()

const route = useRoute()

const { iconName, menuMetaData } = defineProps<{
    iconName: string
    menuMetaData: MenuMetaData
}>()

const uiStore = useSidebarStore()
const menuStore = useMenuStore()

const isCurrentMenuActive = computed(() => menuStore.currentMenuTree?.id === menuMetaData.id)

const isActive = computed(
    () =>
        route.path.startsWith('/content') &&
        isCurrentMenuActive.value &&
        uiStore.currentSidebar === SidebarType.CONTENT
)

const open = () => {
    if (isActive.value && uiStore.currentSidebar === SidebarType.CONTENT && isCurrentMenuActive) {
        // closing it
        uiStore.closeSidebar()
    } else if (isActive.value) {
        uiStore.setSidebar(SidebarType.CONTENT)
        menuStore.setCurrentMenuTree(menuMetaData)
    } else {
        uiStore.setSidebar(SidebarType.CONTENT)
        menuStore.setCurrentMenuTree(menuMetaData)

        if (!route.path.startsWith('/content')) {
            // router.push('/content')
        }
    }
}
</script>

<template>
    <SidebarButton
        :is-active="isActive"
        :title="$t('menu.projectInfo')"
        :iconName="iconName"
        @click="open"
    />
</template>
