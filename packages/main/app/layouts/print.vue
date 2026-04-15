<!-- eslint multi-word: off-->
<script lang="ts" setup>
// Padding in millimeters to add around the print (internal to the page)
const PRINT_PADDING_MM = 4
const { getPrintConfigFromUrl } = useUrlParams()
const printConfig = getPrintConfigFromUrl()

const containerWidth = ref('100dw')
const containerHeight = ref('100dvh')
const containerPadding = ref('0')

onMounted(() => {
    // We want the padding to be internal to the page
    const padding = computeNumberOfPixelsForPrint(PRINT_PADDING_MM, printConfig.resolution)
    const {width, height } = getPageSizeInPixels(printConfig.format, printConfig.orientation, printConfig.resolution)
    containerWidth.value = `${width - 2 * padding}px`
    containerHeight.value = `${height - 2 * padding}px`
    containerPadding.value = `${padding}px`
})
</script>

<template>
    <main
        ref="main"
        class="font-sans"
        :style="{ 
            width: containerWidth, 
            height: containerHeight,
            padding: containerPadding,
        }"
    >
        <slot />
    </main>
</template>
