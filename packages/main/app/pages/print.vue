<script lang="ts" setup>
import { getPageSizeInPixels } from '../utils/printUtils';


const { printConfig } = usePrintStore()
console.log("printConfig", printConfig);

if (printConfig) {
    const pageSizePixel = getPageSizeInPixels(printConfig?.format, printConfig?.orientation, printConfig?.resolution)
    console.log(">>> pageSizePixel", pageSizePixel);
    
}

</script>


<template>
    <NuxtLayout name="print">
        <MapViewer :show-ui="false"/>
    </NuxtLayout>
</template>