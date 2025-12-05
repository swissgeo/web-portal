<script lang="ts" setup>
import { LogoPic } from '#components'
import { useUiStore } from '@swissgeo/skeleton'

const interfaceStore = useUiStore()

function resetApp() {}
</script>

<template>
    <div class="absolute top-0 left-0 flex h-screen w-auto min-w-12 shadow-lg">
        <div class="flex flex-col">
            <div class="flex shrink-0 justify-center bg-white">
                <LogoPic
                    class="h-12"
                    :condensed="!interfaceStore.isSidebarOpen"
                    @logo-click="resetApp"
                />
            </div>
        </div>
    </div>
</template>
