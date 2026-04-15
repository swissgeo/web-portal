<!-- eslint multi-word: off-->
<script lang="ts" setup>
const { getPrintConfigFromUrl } = useUrlParams()
const printConfig = getPrintConfigFromUrl()

const containerWidth = ref('100dw')
const containerHeight = ref('100dvh')

onMounted(() => {
    const {width, height } = getPageSizeInPixels(printConfig.format, printConfig.orientation, printConfig.resolution)
    containerWidth.value = `${width}px`
    containerHeight.value = `${height}px`
})
</script>

<template>
    <main
        ref="main"
        class="font-sans"
        :style="{ 
            width: containerWidth, 
            height: containerHeight, 
        }"
    >
        <slot />
    </main>
</template>
