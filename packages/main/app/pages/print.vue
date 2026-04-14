<script lang="ts" setup>

const { printConfig } = usePrintStore()
console.log("printConfig", printConfig);

</script>


<template>
    <NuxtLayout name="print">
        <MapViewer :show-ui="false"/>
    </NuxtLayout>
</template>