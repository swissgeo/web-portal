<!-- eslint multi-word: off-->
<script lang="ts" setup>
// Margin in millimeters to add around the print (internal to the page)
const PRINT_MARGIN_MM = 4
const { getPrintConfigFromUrl } = useUrlParams()
const printConfig = getPrintConfigFromUrl()

const containerWidth = ref('100dw')
const containerHeight = ref('100dvh')
const containerMargin = ref('0')

onMounted(() => {
    // We want the padding to be internal to the page
    const margin = computeNumberOfPixelsForPrint(PRINT_MARGIN_MM, printConfig.resolution)
    const {width, height } = getPageSizeInPixels(printConfig.format, printConfig.orientation, printConfig.resolution)
    containerWidth.value = `${width - 2 * margin}px`
    containerHeight.value = `${height - 2 * margin}px`
    containerMargin.value = `${margin}px`
})
</script>

<template>
    <main
        ref="main"
        class="font-sans"
        :style="{ 
            width: containerWidth, 
            height: containerHeight,
            margin: containerMargin,
        }"
    >
        <slot />
    </main>
</template>
