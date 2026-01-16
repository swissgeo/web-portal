<script lang="ts" setup>
import { MapModule } from '@swissgeo/map'
</script>

<template>
    <ClientOnly>
        <MapModule class="h-screen w-full" />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>
    </ClientOnly>
</template>
