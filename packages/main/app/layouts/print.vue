<!-- eslint multi-word: off-->
<script lang="ts" setup>

const printStore = usePrintStore()
const width = ref('100dw')
const height = ref('100dvh')

onMounted(() => {
    if (printStore.printSizePixel) {
        width.value = `${printStore.printSizePixel.width}px`
        height.value = `${printStore.printSizePixel.height}px`
    }
})
</script>

<template>
    <main
        ref="main"
        class="font-sans"
        :style="{ 
            width, 
            height, 
        }"
    >
        <slot />
    </main>
</template>
