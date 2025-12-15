<script lang="ts" setup>
const route = useRoute()

// const mainStore = useMainStore()

const openSidebar = () => {
    switch (route.path.split('/')[0]) {
        case 'search':
            // uiStore.setSidebar(SidebarType.SEARCH)
            break
        case 'layerTree':
            // uiStore.setSidebar(SidebarType.LAYER_CART)
            break
        case '/catalogue':
            // uiStore.setSidebar(SidebarType.GEOCATALOG_TREE)
            break
        // case '/content':
        //     openContentSidebar()
        //     break
    }
}

// const openLayerInfo = () => {
//     if (route.path.startsWith('/info')) {
//         const geocatuid = route.params.geocatuid
//         // don't know why it wouldn't be a string
//         if (geocatuid && typeof geocatuid === 'string') {
//             mainStore.setInfoLayerId(geocatuid)
//         }
//         uiStore.setLayerWindowVisible(true)

//         // Ensure watcher triggers by resetting then setting
//         uiStore.setOpenLayerWindowFromDetailButton(false)
//         nextTick(() => {
//             uiStore.setOpenLayerWindowFromDetailButton(true)
//         })
//     }
// }

const openWelcomeOverlay = () => {
    if (route.path === '/') {
        // uiStore.showWelcomeOverlay()
    }
}

onMounted(() => {
    openSidebar()
    // openLayerInfo()
    openWelcomeOverlay()
})

watch(
    () => route,
    () => {
        openSidebar()
    }
)
</script>

<template>
    <div class="block">Home. <NuxtLink to="map">Go to map</NuxtLink></div>
</template>
