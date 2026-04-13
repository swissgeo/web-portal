<script lang="ts" setup>

const { printConfig } = usePrintStore()

</script>


<template>
    <NuxtLayout name="print">
        <MapViewer :show-ui="false"/>
    </NuxtLayout>
</template>