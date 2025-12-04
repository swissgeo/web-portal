<script lang="ts" setup>
import MapModule from '@swissgeo/map'

const layers = await $fetch('/api/v1/records')
</script>

<template>
    <ClientOnly
        ><MapModule
            :layers="layers.features"
            class="h-screen w-screen"
    /></ClientOnly>
</template>
